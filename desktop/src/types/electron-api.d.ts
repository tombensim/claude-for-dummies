import type {
  ChatMessage,
  ProjectMilestone,
  ProjectMeta,
  RuntimeStatus,
  AuthStatus,
  EnvVar,
  FileCopyResult,
  ProjectPreferences,
} from "./ipc";

declare global {
  interface Window {
    electronAPI?: {
      // Locale
      getSystemLocale: () => Promise<"he" | "en">;

      // Runtime status
      getRuntimeStatus: () => Promise<RuntimeStatus>;

      // Project — file system
      openProject: (path: string) => Promise<boolean>;

      // Project — management
      createProject: (idea: string, locale: string) => Promise<ProjectMeta>;
      listProjects: () => Promise<ProjectMeta[]>;
      switchProject: (id: string) => Promise<ProjectMeta | null>;
      updateProject: (
        id: string,
        updates: Partial<ProjectMeta>
      ) => Promise<ProjectMeta | null>;
      getActiveProject: () => Promise<ProjectMeta | null>;
      removeProject: (id: string) => Promise<boolean>;

      // External links
      openExternal: (url: string) => Promise<void>;

      // Agent communication
      onAgentMessage: (callback: (message: unknown) => void) => () => void;
      onAgentError: (callback: (error: string) => void) => () => void;

      // Chat history
      loadChatHistory: (projectPath: string) => Promise<ChatMessage[]>;
      saveChatHistory: (
        projectPath: string,
        messages: ChatMessage[]
      ) => Promise<boolean>;

      // Preferences
      finalizePreferences: (
        projectId: string,
        preferences: ProjectPreferences
      ) => Promise<boolean>;

      // Preview
      pollPort: (port: number) => Promise<boolean>;

      // Milestones
      loadMilestones: (projectPath: string) => Promise<ProjectMilestone[]>;
      saveMilestones: (
        projectPath: string,
        milestones: ProjectMilestone[]
      ) => Promise<boolean>;

      // Inspirations
      loadInspirations: (projectPath: string) => Promise<string[]>;
      saveInspirations: (
        projectPath: string,
        urls: string[]
      ) => Promise<boolean>;

      // Services auth
      checkAuthStatus: () => Promise<AuthStatus>;

      // Environment variables
      loadEnvVars: (projectPath: string) => Promise<EnvVar[]>;
      saveEnvVars: (
        projectPath: string,
        vars: EnvVar[]
      ) => Promise<boolean>;

      // Notes
      loadNotes: (projectPath: string) => Promise<string>;
      saveNotes: (projectPath: string, text: string) => Promise<boolean>;

      // File attachments
      openFileDialog: () => Promise<{
        canceled: boolean;
        filePaths: string[];
      }>;
      copyFilesToProject: (
        projectDir: string,
        filePaths: string[]
      ) => Promise<FileCopyResult[]>;

      // Logging
      getLogPath: () => Promise<string>;
      logToFile: (level: string, message: string) => void;

      // Platform info
      platform: string;
      isPackaged: boolean;
    };
  }
}
