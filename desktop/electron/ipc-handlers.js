const { app } = require("electron");
const path = require("path");
const log = require("electron-log/main");
const projectStore = require("./project-store.mjs");

const { setupSystemIPC } = require("./ipc-system");
const { setupProjectIPC } = require("./ipc-project");
const { setupFilesIPC } = require("./ipc-files");
const { setupPreviewIPC } = require("./ipc-preview");

function getProjectsDir() {
  const home = app.getPath("home");
  return path.join(home, "Documents", "Claude Projects");
}

/**
 * Validate that a path is within the known projects directory.
 * Prevents path traversal attacks from renderer-supplied paths.
 */
function isPathWithinProjectsDir(targetPath) {
  if (typeof targetPath !== "string" || !targetPath.trim()) {
    return false;
  }
  const resolved = path.resolve(targetPath);
  const projectsDir = getProjectsDir();
  return resolved.startsWith(projectsDir + path.sep) || resolved === projectsDir;
}

/**
 * Validate that a path belongs to a known project in the project store.
 */
function isKnownProjectPath(targetPath) {
  if (typeof targetPath !== "string" || !targetPath.trim()) {
    return false;
  }
  const resolved = path.resolve(targetPath);
  const projects = projectStore.getProjects();
  return projects.some((p) => {
    if (!p || typeof p.path !== "string" || !p.path.trim()) {
      return false;
    }
    try {
      const projectPath = path.resolve(p.path);
      return resolved === projectPath || resolved.startsWith(projectPath + path.sep);
    } catch {
      return false;
    }
  });
}

// Shared context passed to sub-modules
const ctx = { getProjectsDir, isPathWithinProjectsDir, isKnownProjectPath };

function setupIPC() {
  setupSystemIPC(ctx);
  setupProjectIPC(ctx);
  setupFilesIPC(ctx);
  setupPreviewIPC(ctx);
  log.info("IPC handlers registered");
}

module.exports = { setupIPC };
