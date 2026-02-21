import { NextRequest } from "next/server";
import { agentLog } from "@/lib/logger";
import { runAgentSDK } from "@/lib/sdk-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * SSE endpoint that streams Claude Agent SDK messages to the renderer.
 *
 * Uses @anthropic-ai/claude-agent-sdk query() instead of spawning a CLI process.
 * The SSE output format is identical to the old CLI --output-format stream-json,
 * so the client-side agent-client.ts parseAgentEvent() works unchanged.
 */
export async function POST(req: NextRequest) {
  const { prompt, images, locale, projectDir, sessionId, mode } = await req.json();
  const buildMode: "plan" | "build" = mode === "build" ? "build" : "plan";

  const requestId = `req-${Date.now().toString(36)}`;
  agentLog.info(`[${requestId}] New agent request`, {
    locale,
    sessionId: sessionId || null,
    buildMode,
    promptLength: prompt.length,
    imageCount: images?.length || 0,
    cwd: projectDir || process.cwd(),
  });

  const encoder = new TextEncoder();
  const abortController = new AbortController();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const safeEnqueue = (data: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(data);
        } catch (err) {
          closed = true;
          agentLog.warn(`[${requestId}] Stream enqueue skipped after close`, {
            error: String(err),
          });
        }
      };
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch (err) {
          agentLog.warn(`[${requestId}] Stream close skipped`, {
            error: String(err),
          });
        }
      };
      try {
        for await (const event of runAgentSDK(
          { prompt, images, locale, projectDir, sessionId, buildMode },
          requestId,
          abortController
        )) {
          const line = JSON.stringify(event);
          safeEnqueue(encoder.encode(`data: ${line}\n\n`));
        }
      } catch (err) {
        agentLog.error(`[${requestId}] Stream error`, {
          error: String(err),
        });
        safeEnqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", content: String(err) })}\n\n`
          )
        );
      } finally {
        safeEnqueue(encoder.encode("data: [DONE]\n\n"));
        safeClose();
      }
    },
  });

  // Kill the SDK query if client disconnects
  req.signal.addEventListener("abort", () => {
    agentLog.info(`[${requestId}] Client disconnected, aborting SDK query`);
    abortController.abort();
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
