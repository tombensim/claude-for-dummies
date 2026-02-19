const { app, ipcMain, shell, dialog } = require("electron");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const net = require("net");
const log = require("electron-log/main");
const { GitProcess } = require("dugite");
const projectStore = require("./project-store.mjs");
const { slugifyIdea, deduplicatePath } = require("./project-utils");
const { findClaude } = require("./find-claude");
const { copySkillFiles, writeProjectClaudeMd, initProgressState } = require("./skill-files");

const LOG_DIR = path.join(require("os").homedir(), ".claude-for-beginners", "logs");

function getProjectsDir() {
  const home = app.getPath("home");
  return path.join(home, "Documents", "Claude Projects");
}

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

// --- IPC registration ---

function setupIPC() {
  // --- System ---

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
    log.info("Opening project path:", projectPath);
    shell.openPath(projectPath);
  });

  ipcMain.handle("shell:open-external", (_event, url) => {
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
      // Simple size-based rotation
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

  // --- Project management ---

  ipcMain.handle("project:create", async (_event, { idea, locale }) => {
    try {
      const baseDir = getProjectsDir();
      fs.mkdirSync(baseDir, { recursive: true });

      const hasIdea = idea && idea.trim();
      const slug = hasIdea ? slugifyIdea(idea) : "new-project";
      const name = await deduplicatePath(baseDir, slug);
      const projectPath = path.join(baseDir, name);

      fs.mkdirSync(projectPath, { recursive: true });
      log.info("[project] Created directory:", projectPath);

      // git init
      const gitResult = await GitProcess.exec(["init"], projectPath);
      if (gitResult.exitCode !== 0) {
        log.warn("[project] git init warning:", gitResult.stderr);
      } else {
        log.info("[project] git init OK in", projectPath);
      }

      // Copy skill files, write CLAUDE.md, initialize progress
      copySkillFiles(projectPath);
      writeProjectClaudeMd(projectPath, hasIdea ? { idea: idea.trim() } : null);
      initProgressState(projectPath);

      const now = new Date().toISOString();
      const meta = {
        id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        displayName: hasIdea ? idea.trim().slice(0, 80) : "",
        path: projectPath,
        createdAt: now,
        lastOpenedAt: now,
        sessionId: null,
        locale: locale || "he",
        vibe: null,
        audience: null,
        priority: null,
        designRef: null,
        liveUrl: null,
        githubUrl: null,
      };

      projectStore.addProject(meta);
      log.info("[project] Created", name, "at", projectPath);
      return meta;
    } catch (err) {
      log.error("[project] Create failed:", err.message);
      throw err;
    }
  });

  ipcMain.handle("project:list", () => {
    const projects = projectStore.getProjects();
    return projects.sort(
      (a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
    );
  });

  ipcMain.handle("project:switch", (_event, id) => {
    const project = projectStore.getProject(id);
    if (!project) {
      log.warn("[project] Switch failed — not found:", id);
      return null;
    }
    if (!fs.existsSync(project.path)) {
      log.warn("[project] Switch failed — dir missing:", project.path);
      return null;
    }
    projectStore.updateProject(id, { lastOpenedAt: new Date().toISOString() });
    projectStore.setActiveProjectId(id);
    log.info("[project] Switched to", project.name);
    return projectStore.getProject(id);
  });

  ipcMain.handle("project:update", (_event, { id, updates }) => {
    const updated = projectStore.updateProject(id, updates);
    if (updated) {
      log.info("[project] Updated", id, Object.keys(updates).join(", "));
    }
    return updated;
  });

  ipcMain.handle("project:get-active", () => {
    return projectStore.getActiveProject();
  });

  ipcMain.handle("project:remove", (_event, id) => {
    const project = projectStore.getProject(id);
    if (!project) {
      log.warn("[project] Remove failed — not found:", id);
      return false;
    }
    projectStore.removeProject(id);
    log.info("[project] Removed", project.name, "(id:", id + ")");
    return true;
  });

  // --- Chat history persistence ---

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

  // --- Finalize preferences ---

  ipcMain.handle("project:finalize-preferences", async (_event, { projectId, preferences }) => {
    try {
      const project = projectStore.getProject(projectId);
      if (!project) {
        log.warn("[project] finalize-preferences: project not found", projectId);
        return false;
      }

      const projectPath = project.path;

      // Re-write CLAUDE.md with full preferences
      writeProjectClaudeMd(projectPath, preferences);

      // Update progress to step 4
      const state = {
        current_step: 4,
        completed: [1, 2, 3],
        phase: 1,
      };
      const statePath = path.join(projectPath, ".cc4d-progress.json");
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");

      // Persist preferences to electron-store
      projectStore.updateProject(projectId, {
        vibe: preferences.vibe || null,
        audience: preferences.audience || null,
        priority: preferences.priority || null,
        designRef: preferences.designRef || null,
      });

      log.info("[project] Finalized preferences for", project.name);
      return true;
    } catch (err) {
      log.error("[project] finalize-preferences failed:", err.message);
      return false;
    }
  });

  // --- Milestones persistence ---

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

  // --- Preview port polling ---

  ipcMain.handle("preview:poll-port", async (_event, port) => {
    const timeout = 30000;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        await new Promise((resolve, reject) => {
          const conn = net.createConnection({ port, host: "127.0.0.1" }, () => {
            conn.end();
            resolve(true);
          });
          conn.on("error", reject);
          conn.setTimeout(1000, () => {
            conn.destroy();
            reject(new Error("timeout"));
          });
        });
        return true;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    return false;
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

  // --- Services auth status ---

  ipcMain.handle("services:check-auth", async () => {
    let github = false;
    let vercel = false;
    let vercelUser = null;
    try {
      execSync("gh auth status", { encoding: "utf-8", timeout: 10000, stdio: "pipe" });
      github = true;
    } catch {}
    try {
      const out = execSync("vercel whoami", { encoding: "utf-8", timeout: 10000, stdio: "pipe" }).trim();
      if (out && !out.includes("Error") && !out.includes("not logged in")) {
        vercel = true;
        vercelUser = out;
      }
    } catch {}
    return { github, vercel, vercelUser };
  });

  // --- Environment variables ---

  ipcMain.handle("env:load", async (_event, projectPath) => {
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
    try {
      const filePath = path.join(projectPath, ".env.local");
      const content = vars
        .filter((v) => v.key.trim())
        .map((v) => `${v.key}=${v.value}`)
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

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  ipcMain.handle("file:copy-to-project", async (_event, { projectDir, filePaths }) => {
    const refsDir = path.join(projectDir, "references");
    fs.mkdirSync(refsDir, { recursive: true });

    const results = [];
    for (const src of filePaths) {
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

  log.info("IPC handlers registered");
}

module.exports = { setupIPC };
