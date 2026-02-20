"use client";

import type { ChatMessage, ImageAttachment } from "./store";
import { useAppStore } from "./store";
import { getPhaseForStep } from "./progress-config";

/** Translates raw tool calls into friendly Shaul-voice status messages */
const toolMessageMap: Record<string, { en: string; he: string }> = {
  "npx create-next-app": {
    en: "Setting up your project... this is the fun part",
    he: "...מכין את הפרויקט שלך — עוד רגע יהיה פה משהו",
  },
  "npm run build": {
    en: "Checking everything works... fingers crossed",
    he: "...בודק שהכל עובד. אצבעות",
  },
  "npm run dev": {
    en: "Starting the preview... almost there",
    he: "...מפעיל תצוגה מקדימה. כמעט שם",
  },
  "git push": {
    en: "Saving your work to the cloud...",
    he: "...שומר את העבודה שלך בענן",
  },
  "git init": {
    en: "Setting the stage...",
    he: "...מכין את הבמה",
  },
  "git commit": {
    en: "Saving a checkpoint... just in case",
    he: "שומר נקודת ביניים... ליתר ביטחון",
  },
  "npx vercel": {
    en: "Putting this on the internet... for real",
    he: "...שם את זה באינטרנט. ברצינות",
  },
  "npm install": {
    en: "Grabbing the tools...",
    he: "...מביא את הכלים",
  },
  "npx shadcn": {
    en: "Adding some nice UI pieces...",
    he: "...מוסיף כמה חלקים יפים",
  },
  mkdir: {
    en: "Organizing things...",
    he: "...מסדר את הבית",
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

/**
 * Detect text that looks like numbered multi-choice questions.
 * Pattern: numbered lines (1. / 2.) with sub-options (- / a) / b) / •).
 */
function parseTextQuestions(
  text: string
): ChatMessage["questionData"] | null {
  const lines = text.split("\n");
  const questions: Array<{
    question: string;
    options: Array<{ label: string; description: string }>;
  }> = [];

  let currentQuestion: (typeof questions)[0] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for numbered question: "1. Question" or "1) Question"
    const qMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (qMatch) {
      if (currentQuestion && currentQuestion.options.length >= 2) {
        questions.push(currentQuestion);
      }
      currentQuestion = { question: qMatch[2], options: [] };
      continue;
    }

    // Check for option: "- Option" or "• Option" or "a) Option"
    if (currentQuestion) {
      const oMatch = trimmed.match(/^(?:[-•]\s*|[a-d]\)\s*)(.+)/);
      if (oMatch) {
        currentQuestion.options.push({
          label: oMatch[1].trim(),
          description: "",
        });
      }
    }
  }

  // Push last question
  if (currentQuestion && currentQuestion.options.length >= 2) {
    questions.push(currentQuestion);
  }

  // Only return if we found at least 1 question with 2+ options
  return questions.length > 0 ? { questions } : null;
}

export interface AgentCallbacks {
  onDevServerDetected?: () => void;
  onFileChanged?: (filePath: string) => void;
  onStepCompleted?: (step: number) => void;
  /** Heuristic: we believe the flow has reached this step (backfills prior steps) */
  onStepHint?: (step: number) => void;
  onLiveUrl?: (url: string) => void;
  /** Preview server confirmed ready with a specific URL */
  onPreviewReady?: (url: string) => void;
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

  // Skip system/init, rate_limit messages
  if (type === "system" || type === "rate_limit_event") {
    return { message: null };
  }

  // Parse user (tool_result) events for preview URLs and dev server readiness
  if (type === "user") {
    const message = raw.message as Record<string, unknown> | undefined;
    const content = message?.content as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === "tool_result") {
          // content can be a string or an array of content blocks
          let resultContent = "";
          if (typeof block.content === "string") {
            resultContent = block.content;
          } else if (Array.isArray(block.content)) {
            resultContent = (block.content as Array<Record<string, unknown>>)
              .filter((b) => b.type === "text")
              .map((b) => b.text as string)
              .join("\n");
          }
          // Detect localhost URL in tool output (e.g. "Local: http://localhost:3000")
          const localhostMatch = resultContent.match(
            /https?:\/\/localhost:(\d+)/
          );
          if (localhostMatch) {
            callbacks?.onPreviewReady?.(localhostMatch[0]);
          }
          // Detect Next.js "Ready in" or Vite "ready in" pattern
          if (/ready in/i.test(resultContent) && localhostMatch) {
            callbacks?.onPreviewReady?.(localhostMatch[0]);
          }
        }
      }
    }
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

        // Detect Vercel deployment URL → hint step 9 (celebrate)
        const urlMatch = text.match(/https:\/\/[\w-]+\.vercel\.app/);
        if (urlMatch) {
          callbacks?.onLiveUrl?.(urlMatch[0]);
          callbacks?.onStepHint?.(9);
        }

        // Note: step 7 (offer-to-ship) is conversation-driven, detected via progress.sh.
        // Step 8 (push-and-deploy) is hinted by deploy commands (npx vercel, etc.).

        // Fallback: detect text that looks like multi-choice questions
        const questionData = parseTextQuestions(text);
        if (questionData) {
          return {
            message: {
              id: `question-${uid()}`,
              role: "assistant",
              content: text,
              timestamp: now,
              questionData,
            },
          };
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

          // Detect dev server start → hint step 5 (react-and-iterate)
          if (command.includes("npm run dev") || command.includes("next dev")) {
            callbacks?.onDevServerDetected?.();
            callbacks?.onStepHint?.(5);
          }

          // Detect build command → hint step 4 (scaffold-and-build)
          if (command.includes("npm run build") || command.includes("next build")) {
            callbacks?.onStepHint?.(4);
          }

          // Detect deploy commands → hint step 8 (push-and-deploy)
          if (
            command.includes("npx vercel") ||
            command.includes("vercel deploy") ||
            command.includes("vercel --prod")
          ) {
            callbacks?.onStepHint?.(8);
          }

          // Detect progress completion (canonical mechanism)
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

        // Write → show filename + notify file change + hint step 4
        if (toolName === "Write" && toolInput?.file_path) {
          callbacks?.onFileChanged?.(toolInput.file_path as string);
          // Writing source files signals scaffold-and-build (step 4)
          const filePath = toolInput.file_path as string;
          if (!filePath.endsWith("CLAUDE.md") && !filePath.includes("progress.sh")) {
            callbacks?.onStepHint?.(4);
          }
          const fileName = basename(filePath);
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
              toolInput: { file_path: filePath },
            },
            activity: statusContent,
          };
        }

        // Edit → show filename + notify file change + hint step 4
        if (toolName === "Edit" && toolInput?.file_path) {
          callbacks?.onFileChanged?.(toolInput.file_path as string);
          const filePath = toolInput.file_path as string;
          if (!filePath.endsWith("CLAUDE.md") && !filePath.includes("progress.sh")) {
            callbacks?.onStepHint?.(4);
          }
          const fileName = basename(filePath);
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
              toolInput: { file_path: filePath },
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

        // Glob/Grep/Read → no visible message, but update activity bar
        if (
          toolName === "Glob" ||
          toolName === "Grep" ||
          toolName === "Read"
        ) {
          const activityText =
            locale === "he" ? "בודק קבצים..." : "Checking files...";
          return { message: null, activity: activityText };
        }

        // AskUserQuestion → pass through as question + hint step 3 (gather-idea)
        if (toolName === "AskUserQuestion") {
          callbacks?.onStepHint?.(3);
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
