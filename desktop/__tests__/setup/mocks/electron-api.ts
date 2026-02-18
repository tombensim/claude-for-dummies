import { vi } from "vitest";

/**
 * Mock factory for window.electronAPI (preload bridge).
 */
export function createMockElectronAPI() {
  return {
    getLocale: vi.fn().mockResolvedValue("en"),
    getRuntimeStatus: vi.fn().mockResolvedValue({
      nodeReady: true,
      gitReady: true,
      claudeReady: true,
    }),
    openProject: vi.fn(),
    openExternal: vi.fn(),
    getLogPath: vi.fn().mockResolvedValue("/tmp/test.log"),
    createProject: vi.fn().mockResolvedValue({
      id: "proj-123",
      name: "test-project",
      path: "/tmp/test-project",
    }),
    listProjects: vi.fn().mockResolvedValue([]),
    switchProject: vi.fn(),
    updateProject: vi.fn(),
    getActiveProject: vi.fn().mockResolvedValue(null),
    sendLog: vi.fn(),
    loadMilestones: vi.fn().mockResolvedValue([]),
    saveMilestones: vi.fn().mockResolvedValue(true),
    loadInspirations: vi.fn().mockResolvedValue([]),
    saveInspirations: vi.fn().mockResolvedValue(true),
    checkAuthStatus: vi.fn().mockResolvedValue({
      github: false,
      vercel: false,
      vercelUser: null,
    }),
    loadEnvVars: vi.fn().mockResolvedValue([]),
    saveEnvVars: vi.fn().mockResolvedValue(true),
    loadNotes: vi.fn().mockResolvedValue(""),
    saveNotes: vi.fn().mockResolvedValue(true),
    openFileDialog: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] }),
    copyFilesToProject: vi.fn().mockResolvedValue([]),
  };
}

export function installMockElectronAPI() {
  const api = createMockElectronAPI();
  Object.defineProperty(window, "electronAPI", {
    value: api,
    writable: true,
    configurable: true,
  });
  return api;
}
