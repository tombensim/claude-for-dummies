const { ipcMain } = require("electron");
const { execSync } = require("child_process");
const net = require("net");
const log = require("electron-log/main");

/**
 * Register preview and services IPC handlers: port polling,
 * external service auth checks.
 */
function setupPreviewIPC() {
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
}

module.exports = { setupPreviewIPC };
