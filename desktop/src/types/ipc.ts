/**
 * Shared types for IPC channels between Electron main and renderer.
 * Used by electron-api.d.ts and IPC handlers.
 */

import type { ChatMessage, ProjectMilestone, ProjectMeta } from "@/lib/store";

// Re-export domain types for convenience
export type { ChatMessage, ProjectMilestone, ProjectMeta };

// --- Runtime ---

export interface RuntimeStatus {
  nodeReady: boolean;
  gitReady: boolean;
  claudeReady: boolean;
}

// --- Services ---

export interface AuthStatus {
  github: boolean;
  vercel: boolean;
  vercelUser: string | null;
}

// --- Environment variables ---

export interface EnvVar {
  key: string;
  value: string;
}

// --- File copy result ---

export interface FileCopyResult {
  src: string;
  dest: string | null;
  copied: boolean;
  error?: string;
}

// --- Preferences ---

export interface ProjectPreferences {
  idea?: string;
  vibe?: string | null;
  audience?: string | null;
  priority?: string | null;
  designRef?: string | null;
}

// --- Claude stream-json event types ---

export interface ClaudeStreamSystemEvent {
  type: "system";
  subtype: string;
  session_id?: string;
}

export interface ClaudeStreamTextBlock {
  type: "text";
  text: string;
  id?: string;
}

export interface ClaudeStreamToolUseBlock {
  type: "tool_use";
  id?: string;
  name: string;
  input: Record<string, unknown>;
}

export type ClaudeStreamContentBlock =
  | ClaudeStreamTextBlock
  | ClaudeStreamToolUseBlock;

export interface ClaudeStreamAssistantEvent {
  type: "assistant";
  message: {
    content: ClaudeStreamContentBlock[];
  };
  session_id?: string;
}

export interface ClaudeStreamToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string | Array<{ type: string; text?: string }>;
}

export interface ClaudeStreamUserEvent {
  type: "user";
  message: {
    content: ClaudeStreamToolResultBlock[];
  };
}

export interface ClaudeStreamResultEvent {
  type: "result";
  subtype: "success" | "error";
  result?: string;
  is_error?: boolean;
  session_id?: string;
}

export interface ClaudeStreamErrorEvent {
  type: "error";
  error?: { message: string };
}

export interface ClaudeStreamRateLimitEvent {
  type: "rate_limit_event";
}

export type ClaudeStreamEvent =
  | ClaudeStreamSystemEvent
  | ClaudeStreamAssistantEvent
  | ClaudeStreamUserEvent
  | ClaudeStreamResultEvent
  | ClaudeStreamErrorEvent
  | ClaudeStreamRateLimitEvent;
