import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseAgentEvent } from "@/lib/agent-client";

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
      content: "Setting up your project...",
      toolName: "Bash",
    });
    expect(activity).toBe("Setting up your project...");
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
      content: "בודק שהכל עובד...",
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

  // --- skipBlocks dedup ---
  it("skips already-processed blocks when skipBlocks is provided", () => {
    const raw = {
      type: "assistant",
      message: {
        content: [
          { type: "text", text: "First message" },
          { type: "text", text: "Second message" },
        ],
      },
    };
    // First call: no skip, should return first block
    const { message: msg1 } = parseAgentEvent(raw, "en", undefined, 0);
    expect(msg1?.content).toBe("First message");

    // Second call: skip 1, should return second block
    const { message: msg2 } = parseAgentEvent(raw, "en", undefined, 1);
    expect(msg2?.content).toBe("Second message");
  });

  it("returns null when all blocks are skipped", () => {
    const raw = {
      type: "assistant",
      message: {
        content: [{ type: "text", text: "Already seen" }],
      },
    };
    const { message } = parseAgentEvent(raw, "en", undefined, 1);
    expect(message).toBeNull();
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
    expect(activity).toBe("Adding components...");
  });
});
