import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore, type ProjectMeta } from "@/lib/store";

beforeEach(() => {
  useAppStore.setState(useAppStore.getInitialState());
});

describe("Zustand store — initial state", () => {
  it("has correct defaults", () => {
    const state = useAppStore.getState();
    expect(state.locale).toBe("he");
    expect(state.currentStep).toBe(1);
    expect(state.phase).toBe(0);
    expect(state.completedSteps).toEqual([]);
    expect(state.messages).toEqual([]);
    expect(state.isStreaming).toBe(false);
    expect(state.messagesLoaded).toBe(false);
    expect(state.currentActivity).toBeNull();
    expect(state.sessionId).toBeNull();
    expect(state.projectDir).toBeNull();
    expect(state.previewUrl).toBeNull();
    expect(state.previewMode).toBe("desktop");
    expect(state.runtimeReady).toBe(false);
    expect(state.claudeAuthenticated).toBe(false);
  });
});

describe("Zustand store — actions", () => {
  it("addMessage appends to messages", () => {
    const msg = {
      id: "m1",
      role: "user" as const,
      content: "Hello",
      timestamp: 1000,
    };
    useAppStore.getState().addMessage(msg);
    expect(useAppStore.getState().messages).toHaveLength(1);
    expect(useAppStore.getState().messages[0].content).toBe("Hello");
  });

  it("loadMessages replaces messages and sets messagesLoaded", () => {
    const msgs = [
      { id: "m1", role: "user" as const, content: "hi", timestamp: 1000 },
      { id: "m2", role: "assistant" as const, content: "hello", timestamp: 1001 },
    ];
    useAppStore.getState().loadMessages(msgs);
    expect(useAppStore.getState().messages).toHaveLength(2);
    expect(useAppStore.getState().messagesLoaded).toBe(true);
  });

  it("completeStep deduplicates", () => {
    useAppStore.getState().completeStep(1);
    useAppStore.getState().completeStep(1);
    useAppStore.getState().completeStep(2);
    expect(useAppStore.getState().completedSteps).toEqual([1, 2]);
  });

  it("setStep updates currentStep and phase", () => {
    useAppStore.getState().setStep(5, 2);
    expect(useAppStore.getState().currentStep).toBe(5);
    expect(useAppStore.getState().phase).toBe(2);
  });

  it("loadProject sets project fields and resets transient state", () => {
    useAppStore.getState().setStreaming(true);
    useAppStore.getState().setPreviewUrl("http://localhost:3000");
    useAppStore.getState().setPreviewMode("mobile");
    useAppStore.getState().setCurrentActivity("Building...");

    const meta: ProjectMeta = {
      id: "proj-1",
      name: "test",
      displayName: "Test Project",
      path: "/tmp/test",
      createdAt: "2024-01-01",
      lastOpenedAt: "2024-01-01",
      sessionId: "sess-1",
      locale: "en",
      vibe: "bold",
      audience: "customers",
      priority: "signup",
      designRef: null,
      liveUrl: "https://test.vercel.app",
      githubUrl: null,
    };

    useAppStore.getState().loadProject(meta);

    const state = useAppStore.getState();
    expect(state.activeProjectId).toBe("proj-1");
    expect(state.projectDir).toBe("/tmp/test");
    expect(state.projectName).toBe("test");
    expect(state.idea).toBe("Test Project");
    expect(state.vibe).toBe("bold");
    expect(state.sessionId).toBe("sess-1");
    expect(state.liveUrl).toBe("https://test.vercel.app");
    // Transient state reset
    expect(state.isStreaming).toBe(false);
    expect(state.messagesLoaded).toBe(false);
    expect(state.currentActivity).toBeNull();
    expect(state.previewUrl).toBeNull();
    expect(state.previewMode).toBe("desktop");
  });

  it("reset returns to initial state", () => {
    useAppStore.getState().setLocale("en");
    useAppStore.getState().setStep(5, 2);
    useAppStore.getState().addMessage({
      id: "m1",
      role: "user",
      content: "test",
      timestamp: 1000,
    });

    useAppStore.getState().reset();
    const state = useAppStore.getState();
    expect(state.locale).toBe("he");
    expect(state.currentStep).toBe(1);
    expect(state.messages).toEqual([]);
  });

  it("setLocale updates locale", () => {
    useAppStore.getState().setLocale("en");
    expect(useAppStore.getState().locale).toBe("en");
  });

  it("setPreviewMode toggles correctly", () => {
    useAppStore.getState().setPreviewMode("mobile");
    expect(useAppStore.getState().previewMode).toBe("mobile");
    useAppStore.getState().setPreviewMode("desktop");
    expect(useAppStore.getState().previewMode).toBe("desktop");
  });

  it("setCurrentActivity updates activity", () => {
    useAppStore.getState().setCurrentActivity("Building...");
    expect(useAppStore.getState().currentActivity).toBe("Building...");
    useAppStore.getState().setCurrentActivity(null);
    expect(useAppStore.getState().currentActivity).toBeNull();
  });
});

describe("Zustand store — partialize", () => {
  it("persist config includes expected keys and excludes transient keys", () => {
    const persistedKeys = [
      "locale",
      "sessionId",
      "projectDir",
      "activeProjectId",
      "currentStep",
      "phase",
      "completedSteps",
      "projectName",
      "liveUrl",
      "githubUrl",
      "userName",
      "vibe",
      "idea",
    ];

    const transientKeys = [
      "messages",
      "isStreaming",
      "previewUrl",
      "previewMode",
      "runtimeReady",
      "claudeAuthenticated",
      "messagesLoaded",
      "currentActivity",
    ];

    const state = useAppStore.getState();
    for (const key of persistedKeys) {
      expect(state).toHaveProperty(key);
    }
    for (const key of transientKeys) {
      expect(state).toHaveProperty(key);
    }
  });
});
