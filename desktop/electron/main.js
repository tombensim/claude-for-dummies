const { app, BrowserWindow, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const net = require("net");
const log = require("electron-log/main");
const { setupIPC } = require("./ipc-handlers");

// --- Logging setup ---

const LOG_DIR = path.join(require("os").homedir(), ".claude-for-beginners", "logs");
fs.mkdirSync(LOG_DIR, { recursive: true });

log.initialize();
log.transports.file.resolvePathFn = () => path.join(LOG_DIR, "electron.log");
log.transports.file.maxSize = 5 * 1024 * 1024; // 5 MB per file
log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
// electron-log auto-rotates: keeps electron.log + electron.old.log

// Override console so all console.log/error also go to file
Object.assign(console, log.functions);

log.info("=== Claude for Beginners starting ===");
log.info("Platform:", process.platform, process.arch);
log.info("Electron:", process.versions.electron);
log.info("Node:", process.versions.node);
log.info("App path:", app.getAppPath());
log.info("Log file:", log.transports.file.getFile().path);

// --- State ---

let mainWindow = null;
let nextServer = null;

// --- Next.js server management ---

function getRandomPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        const port = addr.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error("Failed to get port"));
      }
    });
    server.on("error", reject);
  });
}

async function startNextServer() {
  const port = await getRandomPort();
  log.info("Starting Next.js standalone server on port", port);

  const standalonePath = path.join(app.getAppPath(), ".next", "standalone", "server.js");
  nextServer = spawn(process.execPath, [standalonePath], {
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
    },
    stdio: "pipe",
  });

  nextServer.stdout?.on("data", (data) => {
    log.info("[next]", data.toString().trim());
  });

  nextServer.stderr?.on("data", (data) => {
    log.warn("[next]", data.toString().trim());
  });

  nextServer.on("error", (err) => {
    log.error("[next] Failed to start:", err.message);
  });

  nextServer.on("close", (code) => {
    log.info("[next] Process exited with code", code);
  });

  // Wait for server to be ready
  await new Promise((resolve) => {
    const check = () => {
      const req = net.createConnection({ port, host: "127.0.0.1" }, () => {
        req.end();
        resolve();
      });
      req.on("error", () => {
        setTimeout(check, 200);
      });
    };
    check();
  });

  log.info("Next.js server ready on port", port);
  return port;
}

// --- Window management ---

function createWindow(port, host = "127.0.0.1") {
  const isMac = process.platform === "darwin";
  log.info(`Creating window, loading http://${host}:${port}`);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, "..", "public", "icon.png"),
    titleBarStyle: isMac ? "hiddenInset" : "default",
    trafficLightPosition: isMac ? { x: 16, y: 16 } : undefined,
    backgroundColor: "#FFD700",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
    show: false,
  });

  mainWindow.loadURL(`http://${host}:${port}`);

  mainWindow.once("ready-to-show", () => {
    log.info("Window ready to show");
    mainWindow.show();
    if (!app.isPackaged) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    log.error("Window failed to load:", errorCode, errorDescription);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    log.info("Window finished loading");
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    log.info("Opening external URL:", url);
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    log.info("Window closed");
    mainWindow = null;
  });
}

// --- App lifecycle ---

app.whenReady().then(async () => {
  setupIPC();

  const isDev = !app.isPackaged;
  log.info("Dev mode:", isDev);

  // In dev, Next.js runs externally via concurrently on port 3456.
  // Use "localhost" in dev so HMR WebSocket connects on the same origin.
  const port = isDev ? 3456 : await startNextServer();
  const devHost = isDev ? "localhost" : "127.0.0.1";

  createWindow(port, devHost);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      log.info("Reactivating — creating new window");
      createWindow(port, devHost);
    }
  });
});

app.on("window-all-closed", () => {
  log.info("All windows closed");
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  log.info("=== App quitting ===");
  if (nextServer) {
    log.info("Killing Next.js server");
    nextServer.kill();
    nextServer = null;
  }
});
