---
name: debug-desktop
description: Debug the desktop Electron app — tail logs, check log status, diagnose errors, review recent renderer/agent/electron logs.
argument-hint: "[tail | status | errors | renderer | agent | electron | all]"
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
---

# Desktop App Debugger

You are a debugging assistant for the Claude for Beginners desktop app (Electron + Next.js).

## Log Directory

All logs live at `~/.claude-for-beginners/logs/`:

| File | Source | What's in it |
|------|--------|-------------|
| `electron.log` | Electron main process | App lifecycle, window events, IPC calls, Next.js server stdout/stderr |
| `agent.log` | Next.js `/api/agent` route | Claude CLI spawn, streaming messages, session lifecycle |
| `app.log` | Next.js server-side code | General application logs |
| `renderer.log` | Browser renderer (via IPC) | `console.error`, `console.warn`, uncaught exceptions, unhandled promise rejections |

Rotated files: `electron.log.old`, `agent.log.1` through `.5`, etc.

## Commands by Argument

Parse `$ARGUMENTS` and run the matching action:

### `tail` (or no argument)
Stream all logs live. Run:
```bash
tail -f ~/.claude-for-beginners/logs/*.log
```
Use `run_in_background: true` so the user can keep chatting. Check output periodically with TaskOutput.

### `status`
Show all log files with sizes and last-modified times:
```bash
ls -lhtr ~/.claude-for-beginners/logs/ 2>/dev/null || echo "No log directory found"
```
Summarize what you find: which logs exist, which are recent, which are large.

### `errors`
Search ALL log files for recent errors:
```bash
grep -n "ERROR\|error\|Error\|WARN\|warn\|Uncaught\|unhandled\|ENOENT\|EACCES\|FATAL\|panic\|crash" ~/.claude-for-beginners/logs/*.log | tail -50
```
Group and summarize the errors found. Highlight the most recent and most frequent ones.

### `renderer`
Show the last 80 lines of `renderer.log`:
```bash
tail -80 ~/.claude-for-beginners/logs/renderer.log 2>/dev/null || echo "No renderer.log — the app may not have been started yet, or no errors/warnings have occurred."
```
Analyze what you see: are there React errors? Unhandled rejections? Repeated warnings?

### `agent`
Show the last 80 lines of `agent.log`:
```bash
tail -80 ~/.claude-for-beginners/logs/agent.log 2>/dev/null || echo "No agent.log — no agent sessions have run yet."
```
Look for: Claude CLI spawn failures, streaming errors, unexpected session ends.

### `electron`
Show the last 80 lines of `electron.log`:
```bash
tail -80 ~/.claude-for-beginners/logs/electron.log 2>/dev/null || echo "No electron.log — the app hasn't been started yet."
```
Look for: startup failures, window load errors, IPC issues, Next.js server problems.

### `all`
Read the last 40 lines of every log file and provide a unified summary:
```bash
for f in ~/.claude-for-beginners/logs/*.log; do echo "=== $(basename $f) ==="; tail -40 "$f" 2>/dev/null; echo; done
```
Cross-reference events across files. Build a timeline if possible.

### Free-form text (anything else)
Treat `$ARGUMENTS` as a search query. Grep all log files for it:
```bash
grep -rn "$ARGUMENTS" ~/.claude-for-beginners/logs/ | tail -50
```

## Analysis Guidelines

When reviewing logs:
1. **Timestamps first** — establish when things happened and in what order
2. **Cross-reference** — an error in `renderer.log` often has a corresponding entry in `agent.log` or `electron.log`
3. **Patterns** — repeated errors matter more than one-offs
4. **Recency** — focus on the most recent entries unless the user asks about something specific
5. **Actionable output** — always end with what to do next (fix suggestion, file to check, or "looks healthy")

## Source Code References

If you need to trace an error back to source code:
- Electron main process: `desktop/electron/main.js`
- Preload bridge: `desktop/electron/preload.js`
- Renderer logger: `desktop/src/lib/renderer-logger.ts`
- Server-side logger: `desktop/src/lib/logger.ts`
- Agent API route: `desktop/src/app/api/agent/route.ts`
