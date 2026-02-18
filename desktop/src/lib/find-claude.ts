import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

/**
 * Claude binary candidate paths.
 * Keep in sync with electron/find-claude.js (CJS version for Electron main process).
 */
const CLAUDE_CANDIDATES = [
  join(homedir(), ".local", "bin", "claude"),
  join(homedir(), ".claude", "bin", "claude"),
  "/usr/local/bin/claude",
  "/opt/homebrew/bin/claude",
];

/**
 * Find the Claude CLI binary on disk.
 * Returns the resolved path, or "claude" to fall back to PATH lookup.
 */
export function findClaude(): string {
  for (const p of CLAUDE_CANDIDATES) {
    if (existsSync(p)) return p;
  }
  return "claude";
}
