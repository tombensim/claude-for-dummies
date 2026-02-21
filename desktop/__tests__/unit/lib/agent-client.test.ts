import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseAgentEvent as _parseAgentEvent } from "@/lib/agent-client";
import type { AgentCallbacks } from "@/lib/agent-client";

// Adapter: the real parseAgentEvent now returns ParseResult[].
// These tests were written for the old single-result API.
// This wrapper calls with proper args and returns the first result
// (or a null-message/undefined-activity fallback).
function parseAgentEvent(
  raw: Record<string, unknown>,
  locale: "he" | "en",
  callbacks?: AgentCallbacks,
  _skip?: number
) {
  const results = _parseAgentEvent(raw, locale, callbacks, new Set<string>());
  if (results.length === 0) return { message: null, activity: undefined };
  // Merge all results: first message found + first activity found
  const message = results.find((r) => r.message)?.message ?? null;
  const activity = results.find((r) => r.activity !== undefined)?.activity;
  return { message, activity };
}

// Stable timestamp for deterministic ids
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(1000);
  vi.spyOn(Math, "random").mockReturnValue(0.123456789);
});

describe("parseAgentEvent", () => {
  // --- Skip events ---
  it("returns null message for system events", () => {
    expect(parseAgentEvent({ type: "system", subtype: "init" }, "en").message).toBeNull();
  });

  it("returns null message for rate_limit_event", () => {
    expect(parseAgentEvent({ type: "rate_limit_event" }, "en").message).toBeNull();
  });

  it("returns null message for user events (tool_result)", () => {
    expect(
      parseAgentEvent({ type: "user", message: { content: [] } }, "en").message
    ).toBeNull();
  });

  // --- Assistant text ---
  it("returns null message for assistant with empty text", () => {
    const raw = {
      type: "assistant",
      message: { content: [{ type: "text", text: "   " }] },
    };
    expect(parseAgentEvent(raw, "en").message).toBeNull();
  });

  it("extracts text from assistant content blocks", () => {
    const raw = {
      type: "assistant",
      message: { content: [{ type: "text", text: "Hello world" }] },
    };
    const { message } = parseAgentEvent(raw, "en");
    expect(message).toMatchObject({
      role: "assistant",
      content: "Hello world",
    });
  });

  it("maps interactive numbered options into questionData", () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          {
            type: "text",
            text: "איזה סגנון מתאים לך?\n1. מינימליסטי ונקי\n2. חם ונעים\n3. עתידני ונועז",
          },
        ],
      },
    };
    const { message } = parseAgentEvent(raw, "he");
    expect(message).toMatchObject({
      role: "assistant",
      questionData: {
        questions: [
          {
            question: "איזה סגנון מתאים לך",
            options: [
              { label: "מינימליסטי ונקי" },
              { label: "חם ונעים" },
              { label: "עתידני ונועז" },
            ],
          },
        ],
      },
    });
  });

  it("returns null message for assistant with no message", () => {
    expect(parseAgentEvent({ type: "assistant" }, "en").message).toBeNull();
  });

  it("returns null message for assistant with non-array content", () => {
    expect(
      parseAgentEvent({ type: "assistant", message: { content: "string" } }, "en").message
    ).toBeNull();
  });

  // --- Bash tool_use ---
  it('maps "npx create-next-app" bash to friendly status (en)', () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "Bash",
            input: { command: "npx create-next-app@latest my-app" },
          },
        ],
      },
    };
    const { message, activity } = parseAgentEvent(raw, "en");
    expect(message).toMatchObject({
      role: "status",
      content: "Setting up your project... this is the fun part",
      toolName: "Bash",
    });
    expect(activity).toBe("Setting up your project... this is the fun part");
  });

  it('maps "npm run build" bash to friendly status (he)', () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "Bash",
            input: { command: "npm run build" },
          },
        ],
      },
    };
    const { message } = parseAgentEvent(raw, "he");
    expect(message).toMatchObject({
      role: "status",
      content: "...בודק שהכל עובד. אצבעות",
    });
  });

  it("maps unknown bash command to generic building (en)", () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "Bash",
            input: { command: "echo hello" },
          },
        ],
      },
    };
    const { message } = parseAgentEvent(raw, "en");
    expect(message).toMatchObject({
      role: "status",
      content: "Building...",
    });
  });

  it("maps unknown bash command to generic building (he)", () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "Bash",
            input: { command: "echo hello" },
          },
        ],
      },
    };
    const { message } = parseAgentEvent(raw, "he");
    expect(message).toMatchObject({ content: "בונה..." });
  });

  // --- Write / Edit ---
  it('maps Write tool to "Making changes..." (en)', () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          { type: "tool_use", name: "Write", input: { path: "/a.tsx" } },
        ],
      },
    };
    const { message } = parseAgentEvent(raw, "en");
    expect(message).toMatchObject({
      role: "status",
      content: "Making changes...",
    });
  });

  it('maps Edit tool to "Making changes..." (he)', () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          { type: "tool_use", name: "Edit", input: {} },
        ],
      },
    };
    const { message } = parseAgentEvent(raw, "he");
    expect(message).toMatchObject({
      content: "מבצע שינויים...",
    });
  });

  // --- Glob / Grep / Read → null ---
  it("returns null message for Glob tool", () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          { type: "tool_use", name: "Glob", input: { pattern: "*.ts" } },
        ],
      },
    };
    expect(parseAgentEvent(raw, "en").message).toBeNull();
  });

  it("returns null message for Grep tool", () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          { type: "tool_use", name: "Grep", input: { pattern: "foo" } },
        ],
      },
    };
    expect(parseAgentEvent(raw, "en").message).toBeNull();
  });

  it("returns null message for Read tool", () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          { type: "tool_use", name: "Read", input: { path: "/a" } },
        ],
      },
    };
    expect(parseAgentEvent(raw, "en").message).toBeNull();
  });

  // --- AskUserQuestion ---
  it("passes AskUserQuestion through with questionData", () => {
    const qData = {
      questions: [
        {
          question: "Pick a color",
          options: [{ label: "Red", description: "warm" }],
        },
      ],
    };
    const raw = {
      type: "assistant",
      message: {
        content: [
          { type: "tool_use", name: "AskUserQuestion", input: qData },
        ],
      },
    };
    const { message } = parseAgentEvent(raw, "en");
    expect(message).toMatchObject({
      role: "assistant",
      content: "",
      toolName: "AskUserQuestion",
      questionData: qData,
    });
  });

  // --- Other tools → null ---
  it("returns null message for unknown tool names", () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          { type: "tool_use", name: "TodoWrite", input: {} },
        ],
      },
    };
    expect(parseAgentEvent(raw, "en").message).toBeNull();
  });

  // --- Result events ---
  it("handles result/success with content → null message (already streamed)", () => {
    const raw = {
      type: "result",
      subtype: "success",
      result: "Done building!",
    };
    const { message, activity } = parseAgentEvent(raw, "en");
    expect(message).toBeNull();
    expect(activity).toBeNull();
  });

  it("handles result/success with empty result → null message", () => {
    const raw = { type: "result", subtype: "success", result: "" };
    const { message, activity } = parseAgentEvent(raw, "en");
    expect(message).toBeNull();
    expect(activity).toBeNull();
  });

  it("handles result/success with no result → null message", () => {
    const raw = { type: "result", subtype: "success" };
    const { message, activity } = parseAgentEvent(raw, "en");
    expect(message).toBeNull();
    expect(activity).toBeNull();
  });

  it("handles result/error → retry status (en)", () => {
    const raw = { type: "result", subtype: "error" };
    const { message, activity } = parseAgentEvent(raw, "en");
    expect(message).toMatchObject({
      role: "status",
      content: "Whoops. Give me a sec...",
    });
    expect(activity).toBeNull();
  });

  it("handles result/error → retry status (he)", () => {
    const raw = { type: "result", subtype: "error" };
    const { message } = parseAgentEvent(raw, "he");
    expect(message).toMatchObject({
      content: "אופס. שנייה...",
    });
  });

  it("ignores result/error_during_execution pseudo-errors", () => {
    const raw = {
      type: "result",
      subtype: "error_during_execution",
      is_error: true,
    };
    const { message, activity } = parseAgentEvent(raw, "en");
    expect(message).toBeNull();
    expect(activity).toBeNull();
  });

  // --- Error event ---
  it("handles error event → retry status", () => {
    const raw = { type: "error", message: "something broke" };
    const { message, activity } = parseAgentEvent(raw, "en");
    expect(message).toMatchObject({
      role: "status",
      content: "Whoops. Give me a sec...",
    });
    expect(activity).toBeNull();
  });

  // --- Unknown type ---
  it("returns null message for unknown event types", () => {
    expect(parseAgentEvent({ type: "unknown_type" }, "en").message).toBeNull();
  });

  // --- seenBlockIds dedup ---
  it("skips already-seen blocks via seenBlockIds", () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          { type: "text", text: "First message", id: "block-1" },
          { type: "text", text: "Second message", id: "block-2" },
        ],
      },
    };
    const seen = new Set<string>();
    // First call: returns both blocks, first message wins in our wrapper
    const results1 = _parseAgentEvent(raw, "en", undefined, seen);
    expect(results1.length).toBe(2);
    expect(results1[0].message?.content).toBe("First message");
    expect(results1[1].message?.content).toBe("Second message");
    expect(seen.has("block-1")).toBe(true);
    expect(seen.has("block-2")).toBe(true);

    // Second call with same seen set: both blocks skipped
    const results2 = _parseAgentEvent(raw, "en", undefined, seen);
    expect(results2.length).toBe(0);
  });

  it("returns empty array when all blocks are already seen", () => {
    const raw = {
      type: "assistant",
      message: {
        content: [{ type: "text", text: "Already seen", id: "block-x" }],
      },
    };
    const seen = new Set<string>(["block-x"]);
    const results = _parseAgentEvent(raw, "en", undefined, seen);
    expect(results.length).toBe(0);
  });

  it("does not drop AskUserQuestion when tool blocks have no ids", () => {
    const seen = new Set<string>();

    const firstTool = {
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "Bash",
            input: { command: "echo hello" },
          },
        ],
      },
    };
    const secondTool = {
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "AskUserQuestion",
            input: {
              questions: [
                {
                  question: "Pick one",
                  options: [{ label: "A", description: "" }],
                },
              ],
            },
          },
        ],
      },
    };

    const firstResults = _parseAgentEvent(firstTool, "en", undefined, seen);
    expect(firstResults.length).toBe(1);
    expect(firstResults[0].message?.toolName).toBe("Bash");

    const secondResults = _parseAgentEvent(secondTool, "en", undefined, seen);
    expect(secondResults.length).toBe(1);
    expect(secondResults[0].message?.toolName).toBe("AskUserQuestion");
  });

  it("does not dedupe streaming text blocks that have no ids", () => {
    const seen = new Set<string>();
    const first = {
      type: "assistant",
      message: {
        content: [{ type: "text", text: "Hel" }],
      },
    };
    const second = {
      type: "assistant",
      message: {
        content: [{ type: "text", text: "Hello" }],
      },
    };

    const firstResults = _parseAgentEvent(first, "en", undefined, seen);
    expect(firstResults.length).toBe(1);
    expect(firstResults[0].message?.content).toBe("Hel");

    const secondResults = _parseAgentEvent(second, "en", undefined, seen);
    expect(secondResults.length).toBe(1);
    expect(secondResults[0].message?.content).toBe("Hello");
  });

  it("normalizes single-question AskUserQuestion input shape", () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "AskUserQuestion",
            input: {
              question: "What style?",
              options: ["Bold", "Clean"],
            },
          },
        ],
      },
    };

    const { message } = parseAgentEvent(raw, "en");
    expect(message).toMatchObject({
      toolName: "AskUserQuestion",
      questionData: {
        questions: [
          {
            question: "What style?",
            options: [
              { label: "Bold", description: "" },
              { label: "Clean", description: "" },
            ],
          },
        ],
      },
    });
  });

  // --- Activity tracking ---
  it("does not set activity for text messages", () => {
    const raw = {
      type: "assistant",
      message: { content: [{ type: "text", text: "Hello" }] },
    };
    const { activity } = parseAgentEvent(raw, "en");
    expect(activity).toBeUndefined();
  });

  it("sets activity for status messages", () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          { type: "tool_use", name: "Bash", input: { command: "npm install" } },
        ],
      },
    };
    const { activity } = parseAgentEvent(raw, "en");
    expect(activity).toBe("Grabbing the tools...");
  });
});
