const { app, ipcMain, shell } = require("electron");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const log = require("electron-log/main");
const { findClaude } = require("./find-claude");

const LOG_DIR = path.join(require("os").homedir(), ".claude-for-beginners", "logs");

/**
 * Register system-level IPC handlers: locale, runtime status,
 * shell operations, and renderer log forwarding.
 */
function setupSystemIPC({ isKnownProjectPath }) {
  ipcMain.handle("locale:get", () => {
    const osLocale = app.getLocale();
    const locale = osLocale.startsWith("he") ? "he" : "en";
    log.info("Locale requested:", osLocale, "→", locale);
    return locale;
  });

  ipcMain.handle("runtime:status", async () => {
    let nodeReady = false;
    try {
      const nodeVersion = execSync("node --version", { encoding: "utf-8", timeout: 5000 }).trim();
      const major = parseInt(nodeVersion.replace("v", "").split(".")[0], 10);
      nodeReady = major >= 18;
    } catch {}

    let gitReady = false;
    try {
      execSync("git --version", { timeout: 5000 });
      gitReady = true;
    } catch {}

    const claudeReady = findClaude() !== null;

    const status = { nodeReady, gitReady, claudeReady };
    log.debug("Runtime status:", status);
    return status;
  });

  ipcMain.handle("project:open", (_event, projectPath) => {
    if (!isKnownProjectPath(projectPath)) {
      log.warn("project:open blocked — path not in known projects:", projectPath);
      return;
    }
    log.info("Opening project path:", projectPath);
    shell.openPath(projectPath);
  });

  ipcMain.handle("shell:open-external", (_event, url) => {
    if (typeof url !== "string" || !(url.startsWith("https://") || url.startsWith("http://"))) {
      log.warn("shell:open-external blocked — invalid URL protocol:", url);
      return;
    }
    log.info("Opening external:", url);
    shell.openExternal(url);
  });

  ipcMain.handle("log:get-path", () => {
    return log.transports.file.getFile().path;
  });

  // --- Renderer log forwarding ---

  const rendererLogPath = path.join(LOG_DIR, "renderer.log");
  const RENDERER_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

  ipcMain.on("log:from-renderer", (_event, { level, message }) => {
    const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`;
    try {
      try {
        const stat = fs.statSync(rendererLogPath);
        if (stat.size >= RENDERER_MAX_SIZE) {
          const oldPath = rendererLogPath + ".old";
          try { fs.unlinkSync(oldPath); } catch {}
          fs.renameSync(rendererLogPath, oldPath);
        }
      } catch {}
      fs.appendFileSync(rendererLogPath, line);
    } catch {}
  });
}

module.exports = { setupSystemIPC };
