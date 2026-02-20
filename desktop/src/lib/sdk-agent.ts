/**
 * SDK-based agent backend.
 *
 * Uses @anthropic-ai/claude-agent-sdk query() instead of spawning the Claude CLI.
 * This module runs server-side (Node.js) and is called by the API route.
 *
 * With includePartialMessages: true, the SDK emits:
 *   stream_event (content_block_start / content_block_delta / content_block_stop)
 *   assistant    (complete message — duplicate of what was already streamed)
 *   user         (tool results)
 *   result       (final)
 *
 * We accumulate stream_event deltas and emit a complete message per content block
 * on content_block_stop. This matches the old CLI stream-json behavior where each
 * content block was emitted as a separate event.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { homedir } from "os";
import { agentLog, createLogger } from "@/lib/logger";

const PROJECTS_DIR = join(homedir(), "Documents", "Claude Projects");

const debugLog = createLogger("agent-debug");

interface ImagePayload {
  id: string;
  filename: string;
  mimeType: string;
  base64: string;
  sizeBytes: number;
}

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

async function saveImages(
  projectDir: string,
  images: ImagePayload[],
  requestId: string
): Promise<string[]> {
  // Validate projectDir is within the expected projects directory
  const resolvedDir = resolve(projectDir);
  if (!resolvedDir.startsWith(PROJECTS_DIR + "/") && resolvedDir !== PROJECTS_DIR) {
    throw new Error(`Invalid project directory: ${projectDir}`);
  }

  const uploadsDir = join(resolvedDir, ".cc4d", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const savedPaths: string[] = [];
  for (const img of images) {
    const ext = MIME_TO_EXT[img.mimeType] || "png";
    const filename = `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const filePath = join(uploadsDir, filename);
    const buffer = Buffer.from(img.base64, "base64");
    await writeFile(filePath, buffer);
    savedPaths.push(filePath);
    agentLog.info(`[${requestId}] Saved image`, {
      path: filePath,
      size: buffer.length,
    });
  }
  return savedPaths;
}

export interface AgentRequestOptions {
  prompt: string;
  images?: ImagePayload[];
  locale: "he" | "en";
  projectDir?: string;
  sessionId?: string;
  buildMode?: "plan" | "build";
}

/**
 * Run the Claude Agent SDK and yield SSE-compatible JSON objects.
 *
 * Each yielded object matches the format that parseAgentEvent() expects:
 *   { type: "assistant", message: { content: [{type:"text", text}] } }
 *   { type: "assistant", message: { content: [{type:"tool_use", name, input}] } }
 *   { type: "result", subtype, session_id, ... }
 *   { type: "system", ... }
 *   { type: "user", ... }
 *
 * Content blocks are emitted one at a time on content_block_stop, matching
 * the old CLI stream-json behavior.
 */
export async function* runAgentSDK(
  options: AgentRequestOptions,
  requestId: string,
  abortController: AbortController
): AsyncGenerator<Record<string, unknown>> {
  const { prompt, images, locale, projectDir, sessionId, buildMode = "plan" } = options;

  // Save images to disk and build prompt suffix
  let imageSuffix = "";
  if (images?.length && projectDir) {
    try {
      const savedPaths = await saveImages(projectDir, images, requestId);
      const pathList = savedPaths
        .map((p) => `Read the image from: ${p}`)
        .join("\n");
      imageSuffix = `\n\n[The user attached ${savedPaths.length} image(s). Use the Read tool to view them:\n${pathList}]`;
    } catch (err) {
      agentLog.error(`[${requestId}] Failed to save images`, {
        error: String(err),
      });
    }
  }

  const planModePrefix = buildMode === "plan"
    ? `[Enter Plan Mode. You are in PLAN MODE. DO NOT create, write, or modify any files. DO NOT run any commands. Your ONLY job is to ask the user questions and create a plan. Ask questions one at a time. When you have enough information, present a clear plan summary.]\n\n`
    : "";

  const localizedPrompt =
    locale === "he"
      ? `${planModePrefix}[IMPORTANT: Respond in Hebrew. The user speaks Hebrew.]\n\n${prompt}${imageSuffix}`
      : `${planModePrefix}${prompt}${imageSuffix}`;

  agentLog.info(`[${requestId}] Starting SDK query`, {
    locale,
    sessionId: sessionId || null,
    promptLength: localizedPrompt.length,
    imageCount: images?.length || 0,
    cwd: projectDir || process.cwd(),
  });

  const sdkOptions: Parameters<typeof query>[0]["options"] = {
    allowedTools: [
      "Read",
      "Write",
      "Edit",
      "Bash",
      "Glob",
      "Grep",
      "WebSearch",
      "WebFetch",
      "AskUserQuestion",
    ],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    cwd: projectDir || process.cwd(),
    settingSources: ["project"],
    includePartialMessages: true,
  };

  if (sessionId) {
    sdkOptions.resume = sessionId;
  }

  let messageCount = 0;

  // Accumulator state for stream events
  let currentBlockType: string | null = null;
  let accumulatedText = "";
  let toolUse: { name: string; id: string; inputJson: string } | null = null;

  try {
    const stream = query({
      prompt: localizedPrompt,
      options: {
        ...sdkOptions,
        abortController,
      },
    });

    for await (const message of stream) {
      messageCount++;
      const msg = message as SDKMessage;
      const raw = msg as unknown as Record<string, unknown>;

      debugLog.debug(`[${requestId}] raw`, raw);

      // --- Handle stream_event: accumulate deltas, emit on block_stop ---
      if (msg.type === "stream_event") {
        const event = (msg as unknown as { event: Record<string, unknown> })
          .event;
        const eventType = event.type as string;

        if (eventType === "content_block_start") {
          const cb = event.content_block as Record<string, unknown>;
          currentBlockType = (cb?.type as string) || null;

          if (currentBlockType === "text") {
            accumulatedText = "";
          } else if (currentBlockType === "tool_use") {
            toolUse = {
              name: (cb.name as string) || "",
              id: (cb.id as string) || "",
              inputJson: "",
            };
          }
          continue;
        }

        if (eventType === "content_block_delta") {
          const delta = event.delta as Record<string, unknown>;
          const deltaType = delta?.type as string;

          if (deltaType === "text_delta" && currentBlockType === "text") {
            accumulatedText += (delta.text as string) || "";
            // Emit partial text immediately for real-time streaming.
            // The _streaming flag tells the client to update the last
            // message instead of adding a new one.
            yield {
              type: "assistant",
              _streaming: true,
              message: {
                content: [{ type: "text", text: accumulatedText }],
              },
            };
          } else if (
            deltaType === "input_json_delta" &&
            currentBlockType === "tool_use" &&
            toolUse
          ) {
            toolUse.inputJson += (delta.partial_json as string) || "";
          }
          continue;
        }

        if (eventType === "content_block_stop") {
          // Text was already streamed via deltas — just log and reset
          if (currentBlockType === "text" && accumulatedText) {
            agentLog.debug(`[${requestId}] text block complete`, {
              length: accumulatedText.length,
            });
            accumulatedText = "";
          }

          // Emit completed tool_use block
          if (currentBlockType === "tool_use" && toolUse) {
            let input: Record<string, unknown> = {};
            try {
              input = JSON.parse(toolUse.inputJson || "{}");
            } catch {
              // ignore parse error
            }

            agentLog.debug(`[${requestId}] tool_use complete`, {
              name: toolUse.name,
            });

            yield {
              type: "assistant",
              message: {
                content: [
                  {
                    type: "tool_use",
                    name: toolUse.name,
                    id: toolUse.id,
                    input,
                  },
                ],
              },
            };
            toolUse = null;
          }

          currentBlockType = null;
          continue;
        }

        // Skip other stream events (message_start, message_stop, message_delta)
        continue;
      }

      // --- Skip duplicate complete assistant messages ---
      // Content was already emitted block-by-block via stream_events
      if (msg.type === "assistant") {
        continue;
      }

      // --- Forward system, user, result messages as-is ---
      const logEntry: Record<string, unknown> = {
        type: msg.type,
        seq: messageCount,
      };

      if (msg.type === "result") {
        logEntry.subtype = (msg as Record<string, unknown>).subtype;
        logEntry.duration_ms = (msg as Record<string, unknown>).duration_ms;
        logEntry.num_turns = (msg as Record<string, unknown>).num_turns;
        logEntry.cost_usd = (msg as Record<string, unknown>).total_cost_usd;
        logEntry.session_id = (msg as Record<string, unknown>).session_id;
      }

      agentLog.debug(`[${requestId}] SDK event`, logEntry);
      yield raw;
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      agentLog.info(`[${requestId}] SDK query aborted`);
    } else {
      agentLog.error(`[${requestId}] SDK query error`, {
        error: String(err),
      });
      yield { type: "error", content: String(err) };
    }
  }

  agentLog.info(`[${requestId}] SDK query finished`, { messageCount });
}
