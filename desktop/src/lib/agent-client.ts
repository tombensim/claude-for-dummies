"use client";

import type { ChatMessage, ImageAttachment } from "./store";
import { useAppStore } from "./store";
import { getPhaseForStep } from "./progress-config";

/** Translates raw tool calls into friendly status messages */
const toolMessageMap: Record<string, { en: string; he: string }> = {
  "npx create-next-app": {
    en: "Setting up your project...",
    he: "מכין את הפרויקט שלך...",
  },
  "npm run build": {
    en: "Checking everything works...",
    he: "בודק שהכל עובד...",
  },
  "npm run dev": {
    en: "Starting your preview...",
    he: "מפעיל תצוגה מקדימה...",
  },
  "git push": {
    en: "Saving your project...",
    he: "שומר את הפרויקט...",
  },
  "git init": {
    en: "Initializing project...",
    he: "מאתחל את הפרויקט...",
  },
  "git commit": {
    en: "Saving a checkpoint...",
    he: "שומר נקודת ביניים...",
  },
  "npx vercel": {
    en: "Publishing to the internet...",
    he: "מעלה לאינטרנט...",
  },
  "npm install": {
    en: "Adding components...",
    he: "מוסיף רכיבים...",
  },
  "npx shadcn": {
    en: "Adding UI components...",
    he: "מוסיף רכיבי עיצוב...",
  },
  mkdir: {
    en: "Setting up folders...",
    he: "מכין תיקיות...",
  },
};

function matchToolMessage(
  command: string,
  locale: "he" | "en"
): string | null {
  for (const [pattern, msgs] of Object.entries(toolMessageMap)) {
    if (command.includes(pattern)) {
      return msgs[locale];
    }
  }
  return null;
}

/** Extract just the filename from a full path */
function basename(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] || filePath;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export interface AgentCallbacks {
  onDevServerDetected?: () => void;
  onFileChanged?: (filePath: string) => void;
  onStepCompleted?: (step: number) => void;
  onLiveUrl?: (url: string) => void;
}

/**
 * Parse a Claude CLI stream-json event into a ChatMessage.
 *
 * Claude CLI stream-json format:
 * - {"type":"system","subtype":"init",...} — session init (skip)
 * - {"type":"assistant","message":{"content":[{"type":"text","text":"..."}]}} — assistant text
 * - {"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{...}}]}} — tool use
 * - {"type":"user","message":{"content":[{"type":"tool_result",...}]}} — tool result (skip)
 * - {"type":"result","subtype":"success","result":"..."} — final result
 * - {"type":"error",...} — error
 */
export interface ParseResult {
  message: ChatMessage | null;
  /** Activity text to show in the UI, or null to clear. undefined = no change. */
  activity?: string | null;
}

export function parseAgentEvent(
  raw: Record<string, unknown>,
  locale: "he" | "en",
  callbacks?: AgentCallbacks,
  skipBlocks = 0
): ParseResult {
  const type = raw.type as string;
  const now = Date.now();

  // Skip system/init, rate_limit, user (tool_result) messages
  if (type === "system" || type === "rate_limit_event" || type === "user") {
    return { message: null };
  }

  // Assistant message — contains content blocks
  if (type === "assistant") {
    const message = raw.message as Record<string, unknown> | undefined;
    if (!message) return { message: null };

    const content = message.content as
      | Array<Record<string, unknown>>
      | undefined;
    if (!Array.isArray(content)) return { message: null };

    // Process only NEW content blocks (skip already-processed ones)
    for (let i = skipBlocks; i < content.length; i++) {
      const block = content[i];
      const blockType = block.type as string;

      // Text block — show as assistant message + detect live URLs
      if (blockType === "text") {
        const text = (block.text as string) || "";
        if (!text.trim()) continue;

        // Detect Vercel deployment URL
        const urlMatch = text.match(/https:\/\/[\w-]+\.vercel\.app/);
        if (urlMatch && callbacks?.onLiveUrl) {
          callbacks.onLiveUrl(urlMatch[0]);
        }

        return {
          message: {
            id: `msg-${uid()}`,
            role: "assistant",
            content: text,
            timestamp: now,
          },
        };
      }

      // Tool use block — translate to friendly status
      if (blockType === "tool_use") {
        const toolName = block.name as string;
        const toolInput = block.input as
          | Record<string, unknown>
          | undefined;

        // Bash commands → friendly message + detect dev server / progress
        if (toolName === "Bash" && toolInput?.command) {
          const command = toolInput.command as string;

          // Detect dev server start
          if (command.includes("npm run dev") || command.includes("next dev")) {
            callbacks?.onDevServerDetected?.();
          }

          // Detect progress completion
          const progressMatch = command.match(/progress\.sh\s+complete\s+(\d+)/);
          if (progressMatch) {
            callbacks?.onStepCompleted?.(parseInt(progressMatch[1], 10));
          }

          const friendly = matchToolMessage(command, locale);
          const statusContent = friendly || (locale === "he" ? "בונה..." : "Building...");
          return {
            message: {
              id: `status-${uid()}`,
              role: "status",
              content: statusContent,
              timestamp: now,
              toolName,
              toolInput: { command },
            },
            activity: statusContent,
          };
        }

        // Write → show filename + notify file change
        if (toolName === "Write" && toolInput?.file_path) {
          callbacks?.onFileChanged?.(toolInput.file_path as string);
          const fileName = basename(toolInput.file_path as string);
          const statusContent =
            locale === "he"
              ? `יוצר ${fileName}...`
              : `Creating ${fileName}...`;
          return {
            message: {
              id: `status-${uid()}`,
              role: "status",
              content: statusContent,
              timestamp: now,
              toolName,
              toolInput: { file_path: toolInput.file_path as string },
            },
            activity: statusContent,
          };
        }

        // Edit → show filename + notify file change
        if (toolName === "Edit" && toolInput?.file_path) {
          callbacks?.onFileChanged?.(toolInput.file_path as string);
          const fileName = basename(toolInput.file_path as string);
          const statusContent =
            locale === "he"
              ? `...${fileName} עורך`
              : `Editing ${fileName}...`;
          return {
            message: {
              id: `status-${uid()}`,
              role: "status",
              content: statusContent,
              timestamp: now,
              toolName,
              toolInput: { file_path: toolInput.file_path as string },
            },
            activity: statusContent,
          };
        }

        // Write/Edit without file_path (fallback)
        if (toolName === "Write" || toolName === "Edit") {
          const statusContent =
            locale === "he" ? "מבצע שינויים..." : "Making changes...";
          return {
            message: {
              id: `status-${uid()}`,
              role: "status",
              content: statusContent,
              timestamp: now,
              toolName,
            },
            activity: statusContent,
          };
        }

        // Glob/Grep/Read → skip (internal, not interesting to user)
        if (
          toolName === "Glob" ||
          toolName === "Grep" ||
          toolName === "Read"
        ) {
          return { message: null };
        }

        // AskUserQuestion → pass through as question
        if (toolName === "AskUserQuestion") {
          return {
            message: {
              id: `question-${uid()}`,
              role: "assistant",
              content: "",
              timestamp: now,
              toolName,
              questionData: toolInput as ChatMessage["questionData"],
            },
          };
        }

        // Other tools → generic status
        return { message: null };
      }
    }

    return { message: null };
  }

  // Final result
  if (type === "result") {
    const subtype = raw.subtype as string;

    if (subtype === "error" || raw.is_error) {
      return {
        message: {
          id: `error-${uid()}`,
          role: "status",
          content:
            locale === "he"
              ? "אופס. שנייה..."
              : "Whoops. Give me a sec...",
          timestamp: now,
        },
        activity: null,
      };
    }

    // Success result — skip, the content was already streamed via assistant text blocks.
    // Emitting it again would cause duplicate messages.
    return { message: null, activity: null };
  }

  // Error
  if (type === "error") {
    return {
      message: {
        id: `error-${uid()}`,
        role: "status",
        content:
          locale === "he"
            ? "אופס. שנייה..."
            : "Whoops. Give me a sec...",
        timestamp: now,
      },
      activity: null,
    };
  }

  return { message: null };
}

/**
 * Connect to the agent SSE stream.
 */
export function connectToAgent(options: {
  prompt: string;
  images?: ImageAttachment[];
  locale: "he" | "en";
  projectDir?: string;
  sessionId?: string;
  onMessage: (msg: ChatMessage) => void;
  onDone: () => void;
  onError: (err: string) => void;
  onSessionId?: (sessionId: string) => void;
  onRawEvent?: (raw: Record<string, unknown>, timestamp: number) => void;
  callbacks?: AgentCallbacks;
}): { abort: () => void } {
  const controller = new AbortController();

  const body = JSON.stringify({
    prompt: options.prompt,
    images: options.images,
    locale: options.locale,
    projectDir: options.projectDir,
    sessionId: options.sessionId,
  });

  fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        options.onError(`HTTP ${res.status}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lastAssistantBlockCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              useAppStore.getState().setCurrentActivity(null);
              options.onDone();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              options.onRawEvent?.(parsed, Date.now());
              // Capture session_id from result events
              if (parsed.session_id && options.onSessionId) {
                options.onSessionId(parsed.session_id as string);
              }
              // Track block count for dedup: assistant events are cumulative,
              // so we skip already-processed content blocks.
              // If the new event has FEWER blocks than lastAssistantBlockCount,
              // it's a new conversation turn (not cumulative) — reset skip to 0.
              let skipBlocks = 0;
              if (parsed.type === "assistant") {
                const content = (parsed.message as Record<string, unknown> | undefined)?.content;
                const blockCount = Array.isArray(content) ? content.length : 0;
                skipBlocks = blockCount >= lastAssistantBlockCount ? lastAssistantBlockCount : 0;
              }
              const { message: msg, activity } = parseAgentEvent(parsed, options.locale, options.callbacks, skipBlocks);

              // Update block count after processing
              if (parsed.type === "assistant") {
                const content = (parsed.message as Record<string, unknown> | undefined)?.content;
                lastAssistantBlockCount = Array.isArray(content) ? content.length : 0;
              } else {
                lastAssistantBlockCount = 0;
              }

              if (activity !== undefined) {
                useAppStore.getState().setCurrentActivity(activity);
              }
              if (msg) options.onMessage(msg);
            } catch {
              // Skip unparseable lines
            }
          }
        }
      }

      useAppStore.getState().setCurrentActivity(null);
      options.onDone();
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        useAppStore.getState().setCurrentActivity(null);
        options.onError(err.message);
      }
    });

  return {
    abort: () => controller.abort(),
  };
}
