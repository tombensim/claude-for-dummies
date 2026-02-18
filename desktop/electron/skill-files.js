const { app } = require("electron");
const path = require("path");
const fs = require("fs");
const log = require("electron-log/main");

function getSkillSourceDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "cc4d-skill");
  }
  // Dev mode — resolve relative to this file: electron/skill-files.js → ../../skills/cc4d
  return path.join(__dirname, "..", "..", "skills", "cc4d");
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copySkillFiles(projectPath) {
  const src = getSkillSourceDir();
  const dest = path.join(projectPath, ".cc4d");
  copyDirRecursive(src, dest);
  // Ensure progress.sh is executable
  const progressSh = path.join(dest, "scripts", "progress.sh");
  if (fs.existsSync(progressSh)) {
    fs.chmodSync(progressSh, 0o755);
  }
  log.info("[project] Copied skill files to", dest);
}

function writeProjectClaudeMd(projectPath, preferences) {
  const skillMdPath = path.join(getSkillSourceDir(), "SKILL.md");
  let content = fs.readFileSync(skillMdPath, "utf-8");

  // Strip YAML frontmatter
  content = content.replace(/^---[\s\S]*?---\s*\n/, "");

  // Adjust paths: scripts/ → .cc4d/scripts/, references/ → .cc4d/references/, steps/ → .cc4d/steps/
  content = content.replace(/\bscripts\//g, ".cc4d/scripts/");
  content = content.replace(/\breferences\//g, ".cc4d/references/");
  content = content.replace(/\bsteps\//g, ".cc4d/steps/");

  // Add note about Steps 1-3 being pre-completed by desktop onboarding
  content += "\n\n## Desktop App Note\n\nSteps 1-3 (environment check, orient user, gather idea/preferences) have been pre-completed by the desktop app. The progress state starts at Step 4 (scaffold & build). The user's idea and preferences are listed below.\n";

  // Append user preferences if provided
  if (preferences) {
    content += "\n## What we know (from desktop app onboarding)\n";
    if (preferences.idea) content += `- **Idea**: ${preferences.idea}\n`;
    if (preferences.vibe) content += `- **Style/Vibe**: ${preferences.vibe}\n`;
    if (preferences.audience) content += `- **Audience**: ${preferences.audience}\n`;
    if (preferences.priority) content += `- **Priority**: ${preferences.priority}\n`;
    content += `- **Design reference**: ${preferences.designRef || "Surprise me"}\n`;
  }

  const claudeMdPath = path.join(projectPath, "CLAUDE.md");
  fs.writeFileSync(claudeMdPath, content, "utf-8");
  log.info("[project] Wrote CLAUDE.md to", claudeMdPath);
}

function initProgressState(projectPath) {
  const state = {
    current_step: 4,
    completed: [1, 2, 3],
    phase: 1,
  };
  const statePath = path.join(projectPath, ".cc4d-progress.json");
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
  log.info("[project] Initialized progress state at step 4");
}

module.exports = {
  getSkillSourceDir,
  copySkillFiles,
  writeProjectClaudeMd,
  initProgressState,
};
