# Desktop App — Debugging Guide

## Log Files

All logs live under `~/.claude-for-beginners/logs/`:

| File | Source | Contents |
|------|--------|----------|
| `electron.log` | Electron main process (`electron-log`) | App lifecycle, window events, IPC, Next.js server |
| `agent.log` | Next.js API route (`/api/agent`) | Claude CLI spawn, streaming, session lifecycle |
| `app.log` | Next.js app (server-side) | General app-level logs |
| `renderer.log` | Browser/renderer (via IPC) | `console.error`, `console.warn`, uncaught exceptions |

Rotation: electron.log keeps `.old` backup; others rotate to `.1`, `.2`, etc. (5 MB max, 5 files).

## Tailing Logs

```bash
# All logs at once
npm run logs

# Single file
tail -f ~/.claude-for-beginners/logs/renderer.log

# Check file sizes and dates
npm run debug:status
```

## Running in Dev Mode

```bash
cd desktop
npm run dev
```

This starts Next.js on port 3456 and Electron concurrently. DevTools opens automatically in dev mode.

## Architecture Notes

- `electron/main.js` is the authoritative Electron main process file (plain JS, not TypeScript)
- `electron/preload.js` exposes `window.electronAPI` to the renderer
- Next.js runs as a standalone server in production, as a dev server in dev mode
- The renderer logger (`src/lib/renderer-logger.ts`) patches `console.error`/`console.warn` to forward to main process via IPC
