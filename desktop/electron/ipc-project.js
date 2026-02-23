const { ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const log = require("electron-log/main");
const { GitProcess } = require("dugite");
const projectStore = require("./project-store.mjs");
const { slugifyIdea, deduplicatePath } = require("./project-utils");
const { copySkillFiles, writeProjectClaudeMd, initProgressState } = require("./skill-files");

function isValidProjectMeta(project) {
  return (
    !!project &&
    typeof project.id === "string" &&
    project.id.trim().length > 0 &&
    typeof project.name === "string" &&
    project.name.trim().length > 0 &&
    typeof project.path === "string" &&
    project.path.trim().length > 0
  );
}

/**
 * Register project management IPC handlers: CRUD, switching,
 * preference finalization.
 */
function setupProjectIPC({ getProjectsDir }) {
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
    const valid = [];
    for (const project of projects) {
      if (!isValidProjectMeta(project)) {
        if (project?.id) {
          projectStore.removeProject(project.id);
        }
        log.warn("[project] Removed malformed project metadata entry");
        continue;
      }

      if (!fs.existsSync(project.path)) {
        projectStore.removeProject(project.id);
        log.warn("[project] Removed stale project entry (missing directory):", project.path);
        continue;
      }

      valid.push(project);
    }

    return valid.sort(
      (a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
    );
  });

  ipcMain.handle("project:switch", (_event, id) => {
    if (typeof id !== "string" || !id.trim()) {
      log.warn("[project] Switch failed — invalid project id:", id);
      return null;
    }

    const project = projectStore.getProject(id);
    if (!project) {
      log.warn("[project] Switch failed — not found:", id);
      return null;
    }

    if (!isValidProjectMeta(project)) {
      projectStore.removeProject(id);
      log.warn("[project] Switch failed — malformed project metadata:", id);
      return null;
    }

    if (!fs.existsSync(project.path)) {
      projectStore.removeProject(id);
      log.warn("[project] Switch failed — dir missing:", project.path);
      return null;
    }

    try {
      // Recovery guard for older projects missing metadata directory.
      fs.mkdirSync(path.join(project.path, ".cc4d"), { recursive: true });
    } catch (err) {
      log.warn("[project] Failed to ensure .cc4d directory for", project.path, err.message);
    }

    projectStore.updateProject(id, { lastOpenedAt: new Date().toISOString() });
    projectStore.setActiveProjectId(id);
    log.info("[project] Switched to", project.name);
    return projectStore.getProject(id);
  });

  ipcMain.handle("project:update", (_event, { id, updates }) => {
    if (typeof id !== "string" || !id.trim()) {
      log.warn("[project] Update failed — invalid id:", id);
      return null;
    }
    if (!updates || typeof updates !== "object") {
      log.warn("[project] Update failed — invalid updates payload for", id);
      return null;
    }
    const updated = projectStore.updateProject(id, updates);
    if (updated) {
      log.info("[project] Updated", id, Object.keys(updates).join(", "));
    }
    return updated;
  });

  ipcMain.handle("project:get-active", () => {
    const active = projectStore.getActiveProject();
    if (!active) return null;
    if (!isValidProjectMeta(active) || !fs.existsSync(active.path)) {
      projectStore.setActiveProjectId(null);
      if (active?.id) {
        projectStore.removeProject(active.id);
      }
      log.warn("[project] Cleared stale active project metadata");
      return null;
    }
    return active;
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
}

module.exports = { setupProjectIPC };
