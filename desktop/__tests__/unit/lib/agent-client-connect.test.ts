import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { connectToAgent } from "@/lib/agent-client";

function makeSSEStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const text = lines.join("\n") + "\n";
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("connectToAgent", () => {
  it("POSTs to /api/agent with correct body", () => {
    fetchMock.mockResolvedValue({
      ok: true,
      body: makeSSEStream(["data: [DONE]"]),
    });

    connectToAgent({
      prompt: "Hello",
      locale: "en",
      projectDir: "/tmp/project",
      sessionId: "sess-1",
      onMessage: vi.fn(),
      onDone: vi.fn(),
      onError: vi.fn(),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/agent",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Hello",
          locale: "en",
          projectDir: "/tmp/project",
          sessionId: "sess-1",
        }),
      })
    );
  });

  it("parses SSE data lines and calls onMessage", async () => {
    const messages: unknown[] = [];
    const sseData = JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "text", text: "Hi there" }] },
    });

    fetchMock.mockResolvedValue({
      ok: true,
      body: makeSSEStream([`data: ${sseData}`, "data: [DONE]"]),
    });

    const onDone = vi.fn();

    connectToAgent({
      prompt: "Hello",
      locale: "en",
      onMessage: (msg) => messages.push(msg),
      onDone,
      onError: vi.fn(),
    });

    // Wait for stream processing
    await vi.waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ role: "assistant", content: "Hi there" });
  });

  it("calls onDone on [DONE]", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      body: makeSSEStream(["data: [DONE]"]),
    });

    const onDone = vi.fn();
    connectToAgent({
      prompt: "test",
      locale: "en",
      onMessage: vi.fn(),
      onDone,
      onError: vi.fn(),
    });

    await vi.waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it("calls onDone on stream end (no [DONE])", async () => {
    const sseData = JSON.stringify({
      type: "assistant",
      message: { content: [{ type: "text", text: "Hi" }] },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      body: makeSSEStream([`data: ${sseData}`]),
    });

    const onDone = vi.fn();
    connectToAgent({
      prompt: "test",
      locale: "en",
      onMessage: vi.fn(),
      onDone,
      onError: vi.fn(),
    });

    await vi.waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it("calls onError on HTTP error", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      body: null,
    });

    const onError = vi.fn();
    connectToAgent({
      prompt: "test",
      locale: "en",
      onMessage: vi.fn(),
      onDone: vi.fn(),
      onError,
    });

    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith("HTTP 500"));
  });

  it("calls onError on network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const onError = vi.fn();
    connectToAgent({
      prompt: "test",
      locale: "en",
      onMessage: vi.fn(),
      onDone: vi.fn(),
      onError,
    });

    await vi.waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Failed to fetch")
    );
  });

  it("ignores AbortError", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    fetchMock.mockRejectedValue(abortError);

    const onError = vi.fn();
    connectToAgent({
      prompt: "test",
      locale: "en",
      onMessage: vi.fn(),
      onDone: vi.fn(),
      onError,
    });

    // Wait a tick, onError should not be called
    await new Promise((r) => setTimeout(r, 50));
    expect(onError).not.toHaveBeenCalled();
  });

  it("captures session_id and calls onSessionId", async () => {
    const sseData = JSON.stringify({
      type: "result",
      subtype: "success",
      result: "Done",
      session_id: "sess-abc",
    });

    fetchMock.mockResolvedValue({
      ok: true,
      body: makeSSEStream([`data: ${sseData}`, "data: [DONE]"]),
    });

    const onSessionId = vi.fn();
    const onDone = vi.fn();

    connectToAgent({
      prompt: "test",
      locale: "en",
      onMessage: vi.fn(),
      onDone,
      onError: vi.fn(),
      onSessionId,
    });

    await vi.waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(onSessionId).toHaveBeenCalledWith("sess-abc");
  });

  it("abort() cancels the fetch", () => {
    fetchMock.mockResolvedValue({
      ok: true,
      body: makeSSEStream(["data: [DONE]"]),
    });

    const { abort } = connectToAgent({
      prompt: "test",
      locale: "en",
      onMessage: vi.fn(),
      onDone: vi.fn(),
      onError: vi.fn(),
    });

    // Should not throw
    expect(() => abort()).not.toThrow();
  });
});
