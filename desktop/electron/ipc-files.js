const { app, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const log = require("electron-log/main");

// --- Atomic JSON file helpers ---

function loadJsonFile(filePath, fallback) {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

function saveJsonFileAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(data), "utf-8");
  fs.renameSync(tmpPath, filePath);
}

const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * Register file-oriented IPC handlers: chat history, milestones,
 * inspirations, env vars, notes, and file attachments.
 */
function setupFilesIPC({ isKnownProjectPath }) {
  // --- Chat history ---

  ipcMain.handle("chat:load", async (_event, projectPath) => {
    const filePath = path.join(projectPath, ".cc4d", "chat-history.json");
    return loadJsonFile(filePath, []);
  });

  ipcMain.handle("chat:save", async (_event, { projectPath, messages }) => {
    try {
      const filePath = path.join(projectPath, ".cc4d", "chat-history.json");
      saveJsonFileAtomic(filePath, messages);
      return true;
    } catch (err) {
      log.error("[chat] Save failed:", err.message);
      return false;
    }
  });

  // --- Milestones ---

  ipcMain.handle("milestones:load", async (_event, projectPath) => {
    const filePath = path.join(projectPath, ".cc4d", "milestones.json");
    return loadJsonFile(filePath, []);
  });

  ipcMain.handle("milestones:save", async (_event, { projectPath, milestones }) => {
    try {
      const filePath = path.join(projectPath, ".cc4d", "milestones.json");
      saveJsonFileAtomic(filePath, milestones);
      return true;
    } catch (err) {
      log.error("[milestones] Save failed:", err.message);
      return false;
    }
  });

  // --- Inspirations ---

  ipcMain.handle("inspirations:load", async (_event, projectPath) => {
    const filePath = path.join(projectPath, ".cc4d", "inspirations.json");
    return loadJsonFile(filePath, []);
  });

  ipcMain.handle("inspirations:save", async (_event, { projectPath, urls }) => {
    try {
      const filePath = path.join(projectPath, ".cc4d", "inspirations.json");
      saveJsonFileAtomic(filePath, urls);
      return true;
    } catch (err) {
      log.error("[inspirations] Save failed:", err.message);
      return false;
    }
  });

  // --- Environment variables ---

  ipcMain.handle("env:load", async (_event, projectPath) => {
    if (!isKnownProjectPath(projectPath)) {
      log.warn("env:load blocked — path not in known projects:", projectPath);
      return [];
    }
    const filePath = path.join(projectPath, ".env.local");
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const vars = [];
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        vars.push({
          key: trimmed.slice(0, eqIdx),
          value: trimmed.slice(eqIdx + 1),
        });
      }
      return vars;
    } catch {
      return [];
    }
  });

  ipcMain.handle("env:save", async (_event, { projectPath, vars }) => {
    if (!isKnownProjectPath(projectPath)) {
      log.warn("env:save blocked — path not in known projects:", projectPath);
      return false;
    }
    try {
      const filePath = path.join(projectPath, ".env.local");
      const content = vars
        .filter((v) => v.key.trim() && ENV_KEY_PATTERN.test(v.key.trim()))
        .map((v) => `${v.key.trim()}=${v.value}`)
        .join("\n");
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content + "\n", "utf-8");
      return true;
    } catch (err) {
      log.error("[env] Save failed:", err.message);
      return false;
    }
  });

  // --- Notes ---

  ipcMain.handle("notes:load", async (_event, projectPath) => {
    const filePath = path.join(projectPath, ".cc4d", "notes.md");
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch {
      return "";
    }
  });

  ipcMain.handle("notes:save", async (_event, { projectPath, text }) => {
    try {
      const filePath = path.join(projectPath, ".cc4d", "notes.md");
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, text, "utf-8");
      return true;
    } catch (err) {
      log.error("[notes] Save failed:", err.message);
      return false;
    }
  });

  // --- File attachments ---

  ipcMain.handle("file:open-dialog", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Images & Documents",
          extensions: [
            "png", "jpg", "jpeg", "gif", "svg", "webp",
            "pdf", "doc", "docx", "txt", "md",
            "fig", "sketch", "xd", "ai", "psd",
          ],
        },
      ],
    });
    return { canceled: result.canceled, filePaths: result.filePaths };
  });

  ipcMain.handle("file:copy-to-project", async (_event, { projectDir, filePaths }) => {
    if (!isKnownProjectPath(projectDir)) {
      log.warn("file:copy-to-project blocked — projectDir not in known projects:", projectDir);
      return [];
    }

    const home = app.getPath("home");
    const safePaths = filePaths.filter((src) => {
      const resolved = path.resolve(src);
      if (!resolved.startsWith(home + path.sep)) {
        log.warn("file:copy-to-project blocked source path outside home:", src);
        return false;
      }
      return true;
    });

    const refsDir = path.join(projectDir, "references");
    fs.mkdirSync(refsDir, { recursive: true });

    const results = [];
    for (const src of safePaths) {
      try {
        const stat = fs.statSync(src);
        if (stat.size > MAX_FILE_SIZE) {
          results.push({ src, dest: null, copied: false, error: "File exceeds 50 MB limit" });
          continue;
        }

        const baseName = path.basename(src);
        const ext = path.extname(baseName);
        const nameNoExt = path.basename(baseName, ext);

        let dest = path.join(refsDir, baseName);
        let counter = 1;
        while (fs.existsSync(dest)) {
          counter++;
          dest = path.join(refsDir, `${nameNoExt}-${counter}${ext}`);
        }

        fs.copyFileSync(src, dest);
        results.push({ src, dest, copied: true });
      } catch (err) {
        results.push({ src, dest: null, copied: false, error: err.message });
      }
    }

    log.info("[file] Copied", results.filter((r) => r.copied).length, "files to", refsDir);
    return results;
  });
}

module.exports = { setupFilesIPC };
