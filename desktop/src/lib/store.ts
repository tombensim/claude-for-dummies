"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProjectMilestone {
  id: string;
  type: "choice" | "build" | "change" | "publish" | "other";
  label: string;
  timestamp: number;
}

export interface ImageAttachment {
  id: string;
  filename: string;
  mimeType: string;
  base64: string;
  sizeBytes: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "status";
  content: string;
  timestamp: number;
  images?: ImageAttachment[];
  toolName?: string;
  toolInput?: { file_path?: string; command?: string };
  questionData?: {
    questions: Array<{
      question: string;
      options: Array<{ label: string; description: string }>;
    }>;
  };
}

export interface ProjectMeta {
  id: string;
  name: string;
  displayName: string;
  path: string;
  createdAt: string;
  lastOpenedAt: string;
  sessionId: string | null;
  locale: string;
  vibe: string | null;
  audience: string | null;
  priority: string | null;
  designRef: string | null;
  liveUrl: string | null;
  githubUrl: string | null;
}

interface AppState {
  // Session
  sessionId: string | null;
  projectDir: string | null;
  activeProjectId: string | null;

  // i18n
  locale: "he" | "en";

  // Progress
  currentStep: number;
  phase: number;
  completedSteps: number[];

  // Workspace mode
  isWorkspaceMode: boolean;
  chipsVisible: boolean;

  // Build mode: 'plan' = Claude gathers requirements (web research + question tools), 'build' = Claude executes
  buildMode: "plan" | "build";

  // Chat
  messages: ChatMessage[];
  isStreaming: boolean;
  messagesLoaded: boolean;
  currentActivity: string | null;

  // Project
  projectName: string | null;
  liveUrl: string | null;
  githubUrl: string | null;

  // User
  userName: string | null;
  vibe: string | null;
  audience: string | null;
  priority: string | null;
  designRef: string | null;
  idea: string | null;

  // Project drawer
  projectDrawerOpen: boolean;
  milestones: ProjectMilestone[];
  pendingChatMessage: string | null;

  // Runtime
  runtimeReady: boolean;
  claudeAuthenticated: boolean;

  // Phase transitions
  phaseTransition: { from: number; to: number } | null;

  // Preview
  previewUrl: string | null;
  previewMode: "desktop" | "mobile";

  // Actions
  setLocale: (locale: "he" | "en") => void;
  setSessionId: (id: string) => void;
  setProjectDir: (dir: string) => void;
  setStep: (step: number, phase: number) => void;
  completeStep: (step: number) => void;
  setWorkspaceMode: (isWorkspace: boolean) => void;
  setBuildMode: (mode: "plan" | "build") => void;
  hideChips: () => void;
  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  replaceLastMessage: (msg: ChatMessage) => void;
  loadMessages: (msgs: ChatMessage[]) => void;
  setStreaming: (streaming: boolean) => void;
  setCurrentActivity: (activity: string | null) => void;
  setProjectName: (name: string) => void;
  setLiveUrl: (url: string) => void;
  setGithubUrl: (url: string) => void;
  setUserName: (name: string) => void;
  setIdea: (idea: string) => void;
  setVibe: (vibe: string) => void;
  setAudience: (audience: string) => void;
  setPriority: (priority: string) => void;
  setDesignRef: (ref: string | null) => void;
  setRuntimeReady: (ready: boolean) => void;
  setClaudeAuthenticated: (auth: boolean) => void;
  setPhaseTransition: (transition: { from: number; to: number } | null) => void;
  setPreviewUrl: (url: string | null) => void;
  setPreviewMode: (mode: "desktop" | "mobile") => void;
  setActiveProjectId: (id: string | null) => void;
  toggleProjectDrawer: () => void;
  setProjectDrawerOpen: (open: boolean) => void;
  addMilestone: (milestone: ProjectMilestone) => void;
  loadMilestones: (milestones: ProjectMilestone[]) => void;
  setPendingChatMessage: (msg: string | null) => void;
  loadProject: (meta: ProjectMeta) => void;
  reset: () => void;
  resetForNewProject: () => void;
}

const initialState = {
  sessionId: null,
  projectDir: null,
  activeProjectId: null as string | null,
  locale: "he" as const,
  currentStep: 1,
  phase: 0,
  completedSteps: [],
  isWorkspaceMode: false,
  chipsVisible: false,
  buildMode: "plan" as const,
  messages: [],
  isStreaming: false,
  messagesLoaded: false,
  currentActivity: null,
  projectName: null,
  liveUrl: null,
  githubUrl: null,
  userName: null,
  vibe: null,
  audience: null,
  priority: null,
  designRef: null,
  idea: null,
  projectDrawerOpen: false,
  milestones: [] as ProjectMilestone[],
  pendingChatMessage: null,
  runtimeReady: false,
  claudeAuthenticated: false,
  phaseTransition: null,
  previewUrl: null,
  previewMode: "desktop" as const,
};

// ---------------------------------------------------------------------------
// Selectors — use these instead of bare useAppStore() to avoid full-store
// subscriptions that trigger unnecessary re-renders.
// ---------------------------------------------------------------------------

/** Chat slice: messages, streaming state, activity */
export const useChatStore = () =>
  useAppStore((s) => ({
    messages: s.messages,
    isStreaming: s.isStreaming,
    messagesLoaded: s.messagesLoaded,
    currentActivity: s.currentActivity,
    addMessage: s.addMessage,
    loadMessages: s.loadMessages,
    setStreaming: s.setStreaming,
    setCurrentActivity: s.setCurrentActivity,
  }));

/** Progress slice: step, phase, completed steps, build mode */
export const useProgressStore = () =>
  useAppStore((s) => ({
    currentStep: s.currentStep,
    phase: s.phase,
    completedSteps: s.completedSteps,
    buildMode: s.buildMode,
    setStep: s.setStep,
    completeStep: s.completeStep,
    setBuildMode: s.setBuildMode,
    phaseTransition: s.phaseTransition,
    setPhaseTransition: s.setPhaseTransition,
  }));

/** Project slice: project identity, urls, session */
export const useProjectStore = () =>
  useAppStore((s) => ({
    sessionId: s.sessionId,
    projectDir: s.projectDir,
    activeProjectId: s.activeProjectId,
    projectName: s.projectName,
    liveUrl: s.liveUrl,
    githubUrl: s.githubUrl,
    locale: s.locale,
    idea: s.idea,
    vibe: s.vibe,
    audience: s.audience,
    priority: s.priority,
    designRef: s.designRef,
    isWorkspaceMode: s.isWorkspaceMode,
    setSessionId: s.setSessionId,
    setProjectDir: s.setProjectDir,
    setActiveProjectId: s.setActiveProjectId,
    setProjectName: s.setProjectName,
    setLiveUrl: s.setLiveUrl,
    setGithubUrl: s.setGithubUrl,
    setLocale: s.setLocale,
    setWorkspaceMode: s.setWorkspaceMode,
    loadProject: s.loadProject,
  }));

/** UI slice: preview, drawer, workspace chips */
export const useUIStore = () =>
  useAppStore((s) => ({
    previewUrl: s.previewUrl,
    previewMode: s.previewMode,
    projectDrawerOpen: s.projectDrawerOpen,
    chipsVisible: s.chipsVisible,
    setPreviewUrl: s.setPreviewUrl,
    setPreviewMode: s.setPreviewMode,
    toggleProjectDrawer: s.toggleProjectDrawer,
    setProjectDrawerOpen: s.setProjectDrawerOpen,
    hideChips: s.hideChips,
  }));

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setLocale: (locale) => set({ locale }),
      setSessionId: (sessionId) => set({ sessionId }),
      setProjectDir: (projectDir) => set({ projectDir }),
      setStep: (currentStep, phase) => set({ currentStep, phase }),
      completeStep: (step) =>
        set((state) => ({
          completedSteps: [...new Set([...state.completedSteps, step])],
        })),
      setWorkspaceMode: (isWorkspaceMode) => set({ isWorkspaceMode, chipsVisible: isWorkspaceMode }),
      setBuildMode: (buildMode) => set({ buildMode }),
      hideChips: () => set({ chipsVisible: false }),
      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),
      updateLastMessage: (content: string) =>
        set((state) => {
          const msgs = [...state.messages];
          if (msgs.length > 0) {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
          }
          return { messages: msgs };
        }),
      replaceLastMessage: (msg) =>
        set((state) => {
          const msgs = [...state.messages];
          if (msgs.length > 0) {
            msgs[msgs.length - 1] = msg;
          }
          return { messages: msgs };
        }),
      loadMessages: (msgs) => set({ messages: msgs, messagesLoaded: true }),
      setStreaming: (isStreaming) => set({ isStreaming }),
      setCurrentActivity: (currentActivity) => set({ currentActivity }),
      setProjectName: (projectName) => set({ projectName }),
      setLiveUrl: (liveUrl) => set({ liveUrl }),
      setGithubUrl: (githubUrl) => set({ githubUrl }),
      setUserName: (userName) => set({ userName }),
      setIdea: (idea) => set({ idea }),
      setVibe: (vibe) => set({ vibe }),
      setAudience: (audience) => set({ audience }),
      setPriority: (priority) => set({ priority }),
      setDesignRef: (designRef) => set({ designRef }),
      setRuntimeReady: (runtimeReady) => set({ runtimeReady }),
      setClaudeAuthenticated: (claudeAuthenticated) =>
        set({ claudeAuthenticated }),
      setPhaseTransition: (phaseTransition) => set({ phaseTransition }),
      setPreviewUrl: (previewUrl) => set({ previewUrl }),
      setPreviewMode: (previewMode) => set({ previewMode }),
      setActiveProjectId: (activeProjectId) => set({ activeProjectId }),
      toggleProjectDrawer: () =>
        set((state) => ({ projectDrawerOpen: !state.projectDrawerOpen })),
      setProjectDrawerOpen: (projectDrawerOpen) => set({ projectDrawerOpen }),
      addMilestone: (milestone) =>
        set((state) => ({ milestones: [...state.milestones, milestone] })),
      loadMilestones: (milestones) => set({ milestones }),
      setPendingChatMessage: (pendingChatMessage) => set({ pendingChatMessage }),
      loadProject: (meta) =>
        set((state) => {
          // Workspace mode: project has a session (built at least once)
          const isWorkspace = !!meta.sessionId;
          return {
            activeProjectId: meta.id,
            projectDir: meta.path,
            projectName: meta.name,
            idea: meta.displayName,
            vibe: meta.vibe,
            audience: meta.audience,
            priority: meta.priority,
            designRef: meta.designRef,
            sessionId: meta.sessionId,
            liveUrl: meta.liveUrl,
            githubUrl: meta.githubUrl,
            isWorkspaceMode: isWorkspace,
            chipsVisible: isWorkspace,
            // Reset progress — prevent bleeding from previous project
            currentStep: 1,
            phase: 0,
            completedSteps: [],
            buildMode: isWorkspace ? "build" : "plan",
            // Reset transient state — messages loaded by persistence hook
            messages: [],
            isStreaming: false,
            messagesLoaded: false,
            currentActivity: null,
            previewUrl: null,
            previewMode: "desktop",
            projectDrawerOpen: false,
            milestones: [],
            pendingChatMessage: null,
            phaseTransition: null,
          };
        }),
      reset: () => set({ ...initialState }),
      resetForNewProject: () =>
        set((state) => ({
          ...initialState,
          locale: state.locale,
          userName: state.userName,
          runtimeReady: state.runtimeReady,
          claudeAuthenticated: state.claudeAuthenticated,
        })),
    }),
    {
      name: "cc4d-desktop-store",
      partialize: (state) => ({
        locale: state.locale,
        sessionId: state.sessionId,
        projectDir: state.projectDir,
        activeProjectId: state.activeProjectId,
        currentStep: state.currentStep,
        phase: state.phase,
        completedSteps: state.completedSteps,
        isWorkspaceMode: state.isWorkspaceMode,
        buildMode: state.buildMode,
        projectName: state.projectName,
        liveUrl: state.liveUrl,
        githubUrl: state.githubUrl,
        userName: state.userName,
        vibe: state.vibe,
        idea: state.idea,
      }),
    }
  )
);
