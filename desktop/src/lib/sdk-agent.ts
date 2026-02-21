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
import { constants as fsConstants } from "fs";
import { access, mkdir, readFile, writeFile } from "fs/promises";
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

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function extractCommandCwd(command: string, fallbackCwd: string): string {
  const cdMatch = command.match(/\bcd\s+(['"]?)([^'"&;|]+)\1\s*&&/);
  if (!cdMatch?.[2]) {
    return fallbackCwd;
  }
  return resolve(fallbackCwd, cdMatch[2].trim());
}

function hasDevServerStartCommand(command: string): boolean {
  return /\bnpm\s+run\s+dev\b|\bpnpm\s+dev\b|\byarn\s+dev\b|\bnext\s+dev\b/.test(command);
}

async function hasAgentationSetup(projectCwd: string): Promise<boolean> {
  try {
    const packageJsonPath = join(projectCwd, "package.json");
    const wrapperPath = join(projectCwd, "app", "agentation-wrapper.tsx");
    const layoutPath = join(projectCwd, "app", "layout.tsx");

    const [packageRaw, wrapperExists, layoutRaw] = await Promise.all([
      readFile(packageJsonPath, "utf8"),
      pathExists(wrapperPath),
      readFile(layoutPath, "utf8"),
    ]);

    const packageJson = JSON.parse(packageRaw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const hasDependency =
      Boolean(packageJson.dependencies?.agentation) ||
      Boolean(packageJson.devDependencies?.agentation);
    const hasLayoutUsage = /AgentationWrapper/.test(layoutRaw);

    return hasDependency && wrapperExists && hasLayoutUsage;
  } catch {
    return false;
  }
}

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

  let projectContext = "";
  if (buildMode === "plan") {
    const claudePath = join(projectDir || process.cwd(), "CLAUDE.md");
    try {
      projectContext = await readFile(claudePath, "utf8");
    } catch (err) {
      agentLog.warn(`[${requestId}] Failed to read CLAUDE.md for plan mode`, {
        path: claudePath,
        error: String(err),
      });
    }
  }

  let scaffoldStepContext = "";
  if (buildMode === "build") {
    const scaffoldPath = join(projectDir || process.cwd(), ".cc4d", "steps", "04-scaffold-and-build.md");
    try {
      scaffoldStepContext = await readFile(scaffoldPath, "utf8");
    } catch {
      // Optional context file; skip if missing.
    }
  }

  const planModePrefix = buildMode === "plan"
    ? `[Enter Plan Mode. You are Shaul, the cc4d planner. Stay warm, direct, practical.
You are in PLAN MODE. Do NOT create, write, or modify files. Do NOT run commands.
Ask one question at a time and wait for the user's answer before the next question.
Use numbered options whenever offering choices, exactly like:
1. Option title - short explanation
2. Option title - short explanation
3. Option title - short explanation
When you call AskUserQuestion, stop output for that turn immediately after the tool call.

Required flow:
Step 1: Ask what they want to build.
Step 2: Ask for style/vibe, target audience, and top priority. Use AskUserQuestion when presenting predefined options.
Step 3: Ask for design references. If the user provides a URL, use WebFetch to analyze it (and WebSearch only if needed) and incorporate concrete findings into your recommendations.
Step 4: Do not present a final plan until the user has answered all required discovery questions (goal, vibe, audience, priority, references).
Step 5: Provide a clear plan summary (scope, UX direction, technical approach, milestones, and open questions) and ask for approval to build.

<project-context>
${projectContext || "No CLAUDE.md context found."}
</project-context>]\n\n`
    : "";

  const buildModePrefix = buildMode === "build"
    ? `[Build Mode Safety Rules:
- Before making changes, read CLAUDE.md in the project root.
- If .cc4d exists, read .cc4d/SKILL.md and follow the step files as source-of-truth.
- For generated Next.js projects in this app, do not skip agentation setup steps from .cc4d/steps/04-scaffold-and-build.md.
- Do not present a "ready" preview until agentation is installed and wired via app/agentation-wrapper.tsx + app/layout.tsx.
- This desktop shell runs on port 3456. NEVER stop, kill, or modify processes on port 3456.
- NEVER run broad kill commands (killall/pkill/lsof|xargs kill) unless strictly scoped to this project's own process.
- For project dev servers, prefer port 3000 (or 3001+ if needed).
- If a port is busy, pick another project port instead of killing unrelated processes.
<step-04-context>
${scaffoldStepContext || "No .cc4d/steps/04-scaffold-and-build.md context found."}
</step-04-context>]\n\n`
    : "";

  const modePrefix = buildMode === "plan" ? planModePrefix : buildModePrefix;

  const localizedPrompt =
    locale === "he"
      ? `${modePrefix}[IMPORTANT: Respond in Hebrew. The user speaks Hebrew.]\n\n${prompt}${imageSuffix}`
      : `${modePrefix}${prompt}${imageSuffix}`;

  agentLog.info(`[${requestId}] Starting SDK query`, {
    locale,
    sessionId: sessionId || null,
    promptLength: localizedPrompt.length,
    imageCount: images?.length || 0,
    cwd: projectDir || process.cwd(),
  });

  const buildTools = [
    "Read",
    "Write",
    "Edit",
    "Bash",
    "Glob",
    "Grep",
    "WebSearch",
    "WebFetch",
    "AskUserQuestion",
  ];
  const planTools = ["WebSearch", "WebFetch", "AskUserQuestion"];
  const buildRoot = projectDir || process.cwd();
  const enforceAgentationSetup =
    buildMode === "build" && (await pathExists(join(buildRoot, ".cc4d")));

  const sdkEnv: Record<string, string | undefined> = { ...process.env };
  // Prevent Claude-run project commands from inheriting the desktop shell port.
  // Without this, `npm run dev` in user projects can bind to 3456 and conflict
  // with the desktop app itself.
  sdkEnv.PORT = undefined;
  sdkEnv.npm_config_port = undefined;
  sdkEnv.NEXT_PORT = undefined;
  const canUseTool = async (toolName: string, input: Record<string, unknown>) => {
    if (toolName !== "Bash") {
      return { behavior: "allow" as const, updatedInput: input };
    }

    const command = String(input.command || "");
    const touchesShellPort = /\b3456\b|localhost:3456|127\.0\.0\.1:3456/.test(command);
    const hasKillPattern =
      /\b(pkill|killall|fuser)\b/.test(command) ||
      /\blsof\b[\s\S]*\|\s*xargs\s+kill\b/.test(command) ||
      /\bxargs\s+kill\b/.test(command);

    if (touchesShellPort || hasKillPattern) {
      agentLog.warn(`[${requestId}] Blocked unsafe Bash command`, { command });
      return {
        behavior: "deny" as const,
        message:
          "Do not kill processes or touch port 3456. The desktop shell depends on it. Use a different project port (3000/3001+) and continue.",
        interrupt: false,
      };
    }

    if (enforceAgentationSetup && hasDevServerStartCommand(command)) {
      const commandCwd = extractCommandCwd(command, buildRoot);
      const readyForPreview = await hasAgentationSetup(commandCwd);
      if (!readyForPreview) {
        agentLog.warn(`[${requestId}] Blocked dev server start before Agentation setup`, {
          command,
          cwd: commandCwd,
        });
        return {
          behavior: "deny" as const,
          message:
            "Before starting the dev server, complete Agentation setup: install `agentation`, create `app/agentation-wrapper.tsx`, and render `<AgentationWrapper />` in `app/layout.tsx`.",
          interrupt: false,
        };
      }
    }

    return { behavior: "allow" as const, updatedInput: input };
  };

  const sdkOptions: Parameters<typeof query>[0]["options"] = {
    ...(buildMode === "plan"
      ? {
          tools: planTools as string[],
          allowedTools: planTools,
          permissionMode: "plan" as const,
        }
      : {
          // Build mode: full tool access
          allowedTools: buildTools,
          permissionMode: "bypassPermissions" as const,
          allowDangerouslySkipPermissions: true,
        }),
    cwd: projectDir || process.cwd(),
    env: sdkEnv,
    canUseTool,
    settingSources: ["project"],
    includePartialMessages: true,
  };

  if (sessionId) {
    sdkOptions.resume = sessionId;
  }

  let messageCount = 0;
  let sawSuccessfulResult = false;

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
      if (msg.type === "result") {
        const subtype = (msg as Record<string, unknown>).subtype;
        if (subtype === "success") {
          sawSuccessfulResult = true;
        }
        if (subtype === "error_during_execution" && sawSuccessfulResult) {
          agentLog.warn(`[${requestId}] Ignoring post-success SDK error_during_execution result`);
          continue;
        }
      }

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
    const errorStr = String(err);
    const isAbort =
      (err as Error).name === "AbortError" ||
      errorStr.includes("aborted by user");
    const isPostSuccessSdkExit =
      sawSuccessfulResult &&
      (errorStr.includes("process exited with code 1") ||
        errorStr.includes("only prompt commands are supported in streaming mode"));

    if (isAbort) {
      agentLog.info(`[${requestId}] SDK query aborted`);
    } else if (isPostSuccessSdkExit) {
      agentLog.warn(`[${requestId}] Suppressing post-success SDK process error`, {
        error: errorStr,
      });
    } else {
      agentLog.error(`[${requestId}] SDK query error`, {
        error: errorStr,
      });
      yield { type: "error", content: errorStr };
    }
  }

  agentLog.info(`[${requestId}] SDK query finished`, { messageCount });
}
