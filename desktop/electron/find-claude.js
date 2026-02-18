/**
 * Claude binary discovery for Electron main process (CJS).
 * Keep candidate paths in sync with src/lib/find-claude.ts (ESM version for Next.js).
 */
const path = require("path");
const fs = require("fs");
const os = require("os");

function findClaude() {
  const home = os.homedir();
  const candidates = [
    path.join(home, ".local", "bin", "claude"),
    path.join(home, ".claude", "bin", "claude"),
    "/usr/local/bin/claude",
    "/opt/homebrew/bin/claude",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

module.exports = { findClaude };
