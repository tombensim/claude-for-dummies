import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { agentLog, createLogger } from "@/lib/logger";
import { findClaude } from "@/lib/find-claude";

const debugLog = createLogger("agent-debug");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const claudePath = findClaude();
agentLog.info("Claude binary resolved", { path: claudePath });

/**
 * SSE endpoint that streams Claude CLI messages to the renderer.
 * Spawns `claude --print --output-format stream-json` as a subprocess.
 *
 * Key: stdin must be "ignore" — claude CLI hangs if stdin is piped.
 */
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
  const uploadsDir = join(projectDir, ".cc4d", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const savedPaths: string[] = [];
  for (const img of images) {
    const ext = MIME_TO_EXT[img.mimeType] || "png";
    const filename = `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const filePath = join(uploadsDir, filename);
    const buffer = Buffer.from(img.base64, "base64");
    await writeFile(filePath, buffer);
    savedPaths.push(filePath);
    agentLog.info(`[${requestId}] Saved image`, { path: filePath, size: buffer.length });
  }
  return savedPaths;
}

export async function POST(req: NextRequest) {
  const { prompt, images, locale, projectDir, sessionId } = await req.json();

  const requestId = `req-${Date.now().toString(36)}`;
  agentLog.info(`[${requestId}] New agent request`, {
    locale,
    sessionId: sessionId || null,
    promptLength: prompt.length,
    imageCount: images?.length || 0,
    cwd: projectDir || process.cwd(),
  });

  const encoder = new TextEncoder();

  // Save images to disk and build prompt suffix
  let imageSuffix = "";
  if (images?.length && projectDir) {
    try {
      const savedPaths = await saveImages(projectDir, images as ImagePayload[], requestId);
      const pathList = savedPaths
        .map((p) => `Read the image from: ${p}`)
        .join("\n");
      imageSuffix = `\n\n[The user attached ${savedPaths.length} image(s). Use the Read tool to view them:\n${pathList}]`;
    } catch (err) {
      agentLog.error(`[${requestId}] Failed to save images`, { error: String(err) });
    }
  }

  const localizedPrompt =
    locale === "he"
      ? `[IMPORTANT: Respond in Hebrew. The user speaks Hebrew.]\n\n${prompt}${imageSuffix}`
      : `${prompt}${imageSuffix}`;

  const args = [
    "--print",
    "--output-format",
    "stream-json",
    "--dangerously-skip-permissions",
    "--verbose",
  ];

  if (sessionId) {
    args.push("--resume", sessionId);
  }

  args.push(localizedPrompt);

  const env = { ...process.env };
  delete env.CLAUDECODE;

  const stream = new ReadableStream({
    start(controller) {
      agentLog.info(`[${requestId}] Spawning claude`, {
        binary: claudePath,
        args: args.slice(0, -1), // exclude prompt
      });

      const child = spawn(claudePath, args, {
        cwd: projectDir || process.cwd(),
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      const childPid = child.pid;
      agentLog.info(`[${requestId}] Claude process started`, { pid: childPid });

      let buffer = "";
      let messageCount = 0;

      child.stdout!.on("data", (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            messageCount++;
            debugLog.debug(`[${requestId}] raw`, parsed);

            // Log message type and key info (not full payload — too large)
            const logEntry: Record<string, unknown> = {
              type: parsed.type,
              seq: messageCount,
            };
            if (parsed.type === "assistant" && parsed.message?.content) {
              const content = parsed.message.content;
              if (Array.isArray(content)) {
                logEntry.blocks = content.map((b: Record<string, unknown>) => {
                  if (b.type === "text") return { type: "text", length: (b.text as string)?.length };
                  if (b.type === "tool_use") return { type: "tool_use", name: b.name };
                  return { type: b.type };
                });
              }
            }
            if (parsed.type === "result") {
              logEntry.subtype = parsed.subtype;
              logEntry.duration_ms = parsed.duration_ms;
              logEntry.num_turns = parsed.num_turns;
              logEntry.cost_usd = parsed.total_cost_usd;
              logEntry.session_id = parsed.session_id;
            }
            agentLog.debug(`[${requestId}] SSE event`, logEntry);

            controller.enqueue(encoder.encode(`data: ${line}\n\n`));
          } catch {
            agentLog.warn(`[${requestId}] Non-JSON stdout line`, {
              preview: line.slice(0, 200),
            });
          }
        }
      });

      child.stderr!.on("data", (data: Buffer) => {
        const text = data.toString().trim();
        if (!text) return;
        agentLog.warn(`[${requestId}] Claude stderr`, { text: text.slice(0, 500) });
        if (text.includes("Error") || text.includes("error")) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", content: text })}\n\n`
            )
          );
        }
      });

      child.on("error", (err) => {
        agentLog.error(`[${requestId}] Spawn error`, { error: err.message });
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", content: err.message })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      });

      child.on("close", (code, signal) => {
        agentLog.info(`[${requestId}] Claude process exited`, {
          pid: childPid,
          code,
          signal,
          messageCount,
        });
        if (buffer.trim()) {
          try {
            JSON.parse(buffer);
            controller.enqueue(encoder.encode(`data: ${buffer}\n\n`));
          } catch {
            // ignore
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      });

      req.signal.addEventListener("abort", () => {
        agentLog.info(`[${requestId}] Client disconnected, killing claude`, {
          pid: childPid,
        });
        child.kill("SIGTERM");
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
