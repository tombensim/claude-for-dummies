import { appendFileSync, mkdirSync, readdirSync, statSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const LOG_DIR = join(homedir(), ".claude-for-beginners", "logs");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_FILES = 5; // keep 5 rotated files per category

mkdirSync(LOG_DIR, { recursive: true });

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "debug";

function ts(): string {
  return new Date().toISOString();
}

function rotate(basePath: string) {
  try {
    const stat = statSync(basePath);
    if (stat.size < MAX_FILE_SIZE) return;
  } catch {
    return; // file doesn't exist yet
  }

  // Shift existing rotated files: .4 → delete, .3 → .4, .2 → .3, .1 → .2
  for (let i = MAX_FILES - 1; i >= 1; i--) {
    const from = `${basePath}.${i}`;
    const to = `${basePath}.${i + 1}`;
    try {
      if (i === MAX_FILES - 1) {
        unlinkSync(from);
      } else {
        const { renameSync } = require("fs");
        renameSync(from, to);
      }
    } catch {
      // file doesn't exist, skip
    }
  }

  // current → .1
  try {
    const { renameSync } = require("fs");
    renameSync(basePath, `${basePath}.1`);
  } catch {
    // ignore
  }
}

function write(category: string, level: LogLevel, message: string, data?: unknown) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;

  const filePath = join(LOG_DIR, `${category}.log`);
  const line = data !== undefined
    ? `[${ts()}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}\n`
    : `[${ts()}] [${level.toUpperCase()}] ${message}\n`;

  try {
    rotate(filePath);
    appendFileSync(filePath, line);
  } catch {
    // If logging fails, don't crash the app
  }
}

function cleanOldLogs() {
  try {
    const files = readdirSync(LOG_DIR);
    const now = Date.now();
    const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
    for (const file of files) {
      const filePath = join(LOG_DIR, file);
      try {
        const stat = statSync(filePath);
        if (now - stat.mtimeMs > MAX_AGE) {
          unlinkSync(filePath);
        }
      } catch {
        // skip
      }
    }
  } catch {
    // skip
  }
}

// Clean old logs on module load
cleanOldLogs();

export function createLogger(category: string) {
  return {
    debug: (msg: string, data?: unknown) => write(category, "debug", msg, data),
    info: (msg: string, data?: unknown) => write(category, "info", msg, data),
    warn: (msg: string, data?: unknown) => write(category, "warn", msg, data),
    error: (msg: string, data?: unknown) => write(category, "error", msg, data),
  };
}

export const appLog = createLogger("app");
export const agentLog = createLogger("agent");

export { LOG_DIR };
