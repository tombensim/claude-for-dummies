const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Locale
  getSystemLocale: () => ipcRenderer.invoke("locale:get"),

  // Runtime status
  getRuntimeStatus: () => ipcRenderer.invoke("runtime:status"),

  // Project — file system
  openProject: (path) => ipcRenderer.invoke("project:open", path),

  // Project — management
  createProject: (idea, locale) =>
    ipcRenderer.invoke("project:create", { idea, locale }),
  listProjects: () => ipcRenderer.invoke("project:list"),
  switchProject: (id) => ipcRenderer.invoke("project:switch", id),
  updateProject: (id, updates) =>
    ipcRenderer.invoke("project:update", { id, updates }),
  getActiveProject: () => ipcRenderer.invoke("project:get-active"),
  removeProject: (id) => ipcRenderer.invoke("project:remove", id),

  // External links
  openExternal: (url) => ipcRenderer.invoke("shell:open-external", url),

  // Agent communication
  onAgentMessage: (callback) => {
    const handler = (_event, message) => callback(message);
    ipcRenderer.on("agent:message", handler);
    return () => ipcRenderer.removeListener("agent:message", handler);
  },

  onAgentError: (callback) => {
    const handler = (_event, error) => callback(error);
    ipcRenderer.on("agent:error", handler);
    return () => ipcRenderer.removeListener("agent:error", handler);
  },

  // Chat history
  loadChatHistory: (projectPath) =>
    ipcRenderer.invoke("chat:load", projectPath),
  saveChatHistory: (projectPath, messages) =>
    ipcRenderer.invoke("chat:save", { projectPath, messages }),

  // Finalize preferences (write to CLAUDE.md after welcome flow)
  finalizePreferences: (projectId, preferences) =>
    ipcRenderer.invoke("project:finalize-preferences", { projectId, preferences }),

  // Preview port polling
  pollPort: (port) => ipcRenderer.invoke("preview:poll-port", port),

  // Milestones
  loadMilestones: (projectPath) =>
    ipcRenderer.invoke("milestones:load", projectPath),
  saveMilestones: (projectPath, milestones) =>
    ipcRenderer.invoke("milestones:save", { projectPath, milestones }),

  // Inspirations
  loadInspirations: (projectPath) =>
    ipcRenderer.invoke("inspirations:load", projectPath),
  saveInspirations: (projectPath, urls) =>
    ipcRenderer.invoke("inspirations:save", { projectPath, urls }),

  // Services auth
  checkAuthStatus: () => ipcRenderer.invoke("services:check-auth"),

  // Environment variables
  loadEnvVars: (projectPath) =>
    ipcRenderer.invoke("env:load", projectPath),
  saveEnvVars: (projectPath, vars) =>
    ipcRenderer.invoke("env:save", { projectPath, vars }),

  // Notes
  loadNotes: (projectPath) =>
    ipcRenderer.invoke("notes:load", projectPath),
  saveNotes: (projectPath, text) =>
    ipcRenderer.invoke("notes:save", { projectPath, text }),

  // File attachments
  openFileDialog: () => ipcRenderer.invoke("file:open-dialog"),
  copyFilesToProject: (projectDir, filePaths) =>
    ipcRenderer.invoke("file:copy-to-project", { projectDir, filePaths }),

  // Logging
  getLogPath: () => ipcRenderer.invoke("log:get-path"),
  logToFile: (level, message) =>
    ipcRenderer.send("log:from-renderer", { level, message }),

  // Platform info
  platform: process.platform,
  isPackaged: process.argv.includes("--packaged"),
});
