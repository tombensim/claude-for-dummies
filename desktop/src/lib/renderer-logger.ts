"use client";

// Patches console.error and console.warn to also forward messages
// to the Electron main process via IPC, where they get written to renderer.log.
// Import this module once (e.g. in layout.tsx) — it self-initializes.

function forward(level: string, args: unknown[]) {
  try {
    const api = (window as { electronAPI?: { logToFile?: (level: string, message: string) => void } }).electronAPI;
    if (!api?.logToFile) return;
    const message = args
      .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
      .join(" ");
    api.logToFile(level, message);
  } catch {
    // Never let logging break the app
  }
}

if (typeof window !== "undefined") {
  const origError = console.error;
  const origWarn = console.warn;

  console.error = (...args: unknown[]) => {
    forward("error", args);
    origError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    forward("warn", args);
    origWarn.apply(console, args);
  };

  // Catch unhandled errors
  window.addEventListener("error", (event) => {
    forward("error", [`Uncaught: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`]);
  });

  window.addEventListener("unhandledrejection", (event) => {
    forward("error", [`Unhandled rejection: ${event.reason}`]);
  });
}
