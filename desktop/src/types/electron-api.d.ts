import type { ProjectMeta } from "@/lib/store";

declare global {
  interface Window {
    electronAPI?: {
      // Locale
      getSystemLocale: () => Promise<"he" | "en">;

      // Runtime status
      getRuntimeStatus: () => Promise<{
        nodeReady: boolean;
        gitReady: boolean;
        claudeReady: boolean;
      }>;

      // Project — file system
      openProject: (path: string) => Promise<void>;

      // Project — management
      createProject: (idea: string, locale: string) => Promise<ProjectMeta>;
      listProjects: () => Promise<ProjectMeta[]>;
      switchProject: (id: string) => Promise<ProjectMeta | null>;
      updateProject: (
        id: string,
        updates: Partial<ProjectMeta>
      ) => Promise<ProjectMeta | null>;
      getActiveProject: () => Promise<ProjectMeta | null>;

      // External links
      openExternal: (url: string) => Promise<void>;

      // Agent communication
      onAgentMessage: (callback: (message: unknown) => void) => () => void;
      onAgentError: (callback: (error: string) => void) => () => void;

      // Chat history
      loadChatHistory: (projectPath: string) => Promise<unknown[]>;
      saveChatHistory: (
        projectPath: string,
        messages: unknown[]
      ) => Promise<boolean>;

      // Preferences
      finalizePreferences: (
        projectId: string,
        preferences: {
          idea?: string;
          vibe?: string | null;
          audience?: string | null;
          priority?: string | null;
          designRef?: string | null;
        }
      ) => Promise<boolean>;

      // Preview
      pollPort: (port: number) => Promise<boolean>;

      // Milestones
      loadMilestones: (projectPath: string) => Promise<unknown[]>;
      saveMilestones: (
        projectPath: string,
        milestones: unknown[]
      ) => Promise<boolean>;

      // Inspirations
      loadInspirations: (projectPath: string) => Promise<string[]>;
      saveInspirations: (
        projectPath: string,
        urls: string[]
      ) => Promise<boolean>;

      // Services auth
      checkAuthStatus: () => Promise<{
        github: boolean;
        vercel: boolean;
        vercelUser: string | null;
      }>;

      // Environment variables
      loadEnvVars: (
        projectPath: string
      ) => Promise<Array<{ key: string; value: string }>>;
      saveEnvVars: (
        projectPath: string,
        vars: Array<{ key: string; value: string }>
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
      ) => Promise<
        Array<{
          src: string;
          dest: string | null;
          copied: boolean;
          error?: string;
        }>
      >;

      // Logging
      getLogPath: () => Promise<string>;
      logToFile: (level: string, message: string) => void;

      // Platform info
      platform: string;
      isPackaged: boolean;
    };
  }
}
