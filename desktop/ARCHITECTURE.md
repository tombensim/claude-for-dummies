# Desktop App — Technical Architecture

> Authoritative reference for the `desktop/` Electron app and its integration with the `skills/cc4d/` guided website-building skill.

---

## System Overview

The desktop app is an **Electron + Next.js** hybrid that wraps a Claude Code CLI session inside a friendly UI for non-technical users. The CC4D skill provides a 9-step guided workflow that Claude follows to build and ship a website on the user's behalf.

```
+------------------------------------------------------------------+
|                        ELECTRON SHELL                             |
|  electron/main.js                                                |
|                                                                  |
|  +------------------+    +-------------------+                   |
|  |  BrowserWindow   |    |  electron-store   |                   |
|  |  (Chromium)      |    |  (cc4d-projects)  |                   |
|  +--------+---------+    +-------------------+                   |
|           |                       ^                              |
|           | loads                  | IPC: project:*              |
|           v                       |                              |
|  +--------+---------------------------+---------+                |
|  |              PRELOAD BRIDGE                   |               |
|  |  contextBridge → window.electronAPI           |               |
|  |  (locale, project CRUD, chat I/O, logging)    |               |
|  +--+-------------------------------------------++               |
+-----|---------------------------------------------|---------------+
      |                                             |
      v                                             v
+-----|---------------------------------------------|---------------+
|     |          NEXT.JS APP (port 3456)            |              |
|     |                                             |              |
|  +--+------------------------------------------+  |              |
|  |           RENDERER (React + Zustand)         |  |              |
|  |                                              |  |              |
|  |  /setup → /welcome → /build → /ship → /done |  |              |
|  |                                              |  |              |
|  |  +------------------+  +------------------+  |  |              |
|  |  | ChatPanel        |  | LivePreview      |  |  |              |
|  |  | (user types msg) |  | (webview/iframe) |  |  |              |
|  |  +--------+---------+  +--------+---------+  |  |              |
|  |           |                     ^             |  |              |
|  |           v                     |             |  |              |
|  |  +--------+---------------------+----------+  |  |              |
|  |  |         agent-client.ts                  |  |  |              |
|  |  |  fetch POST → SSE stream → parse events  |  |  |              |
|  |  +-------------------+----------------------+  |  |              |
|  +---------------------------+-------------------+  |              |
|                              |                      |              |
|                    HTTP POST |                      |              |
|                              v                      |              |
|  +---------------------------+-------------------+  |              |
|  |            /api/agent (route.ts)              |  |              |
|  |                                               |  |              |
|  |  1. Resolve claude binary path                |  |              |
|  |  2. spawn("claude", [...args])                |  |              |
|  |     stdio: ["ignore", "pipe", "pipe"]         |  |              |
|  |  3. Stream stdout → SSE events                |  |              |
|  |  4. Return session_id for --resume            |  |              |
|  +-------------------+---------------------------+  |              |
+----------------------|-------------------------------+-------------+
                       |
                       | child_process.spawn
                       v
+----------------------+-------------------------------+
|                  CLAUDE CLI                           |
|  claude --print --output-format stream-json          |
|         --dangerously-skip-permissions               |
|         --verbose [--resume <sessionId>]             |
|                                                      |
|  Reads: CLAUDE.md (project root)                     |
|  Contains: rewritten SKILL.md + user preferences     |
|                                                      |
|  Executes CC4D workflow:                             |
|  +------------------------------------------------+  |
|  |  bash .cc4d/scripts/progress.sh next           |  |
|  |       ↓                                        |  |
|  |  .cc4d-progress.json ←→ progress.sh            |  |
|  |  (current_step, completed[], phase)            |  |
|  |       ↓                                        |  |
|  |  Reads .cc4d/steps/NN-step-name.md             |  |
|  |  Follows ACTION → verifies CHECK → CAPTURE     |  |
|  |       ↓                                        |  |
|  |  bash .cc4d/scripts/progress.sh complete N     |  |
|  |       ↓                                        |  |
|  |  Updates CLAUDE.md with accumulated context     |  |
|  +------------------------------------------------+  |
+------------------------------------------------------+
                       |
                       | creates/modifies files in
                       v
+------------------------------------------------------+
|              PROJECT DIRECTORY                        |
|  ~/Documents/Claude Projects/<project-name>/         |
|                                                      |
|  CLAUDE.md              ← session memory             |
|  .cc4d-progress.json    ← state machine position     |
|  .cc4d/                                              |
|    ├── scripts/progress.sh                           |
|    ├── steps/01..09-*.md                             |
|    ├── references/*.md                               |
|    └── chat-history.json  ← persisted messages       |
|  app/                                                |
|    ├── page.tsx           ← user's website           |
|    └── layout.tsx                                    |
|  package.json                                        |
|  ...                                                 |
+------------------------------------------------------+
```

---

## Electron Main Process

**File:** `electron/main.js`

The main process handles window lifecycle, IPC, Claude binary discovery, skill file management, and the embedded Next.js server.

### Window Lifecycle

1. **Production:** `startNextServer()` spawns the Next.js standalone server on a random available port, then `createWindow(port)` loads it.
2. **Dev mode:** Next.js runs externally on port 3456 via `concurrently`. Electron connects to it directly.
3. Window config: 1280×860, `hiddenInset` title bar on macOS, `webviewTag: true` for LivePreview, `contextIsolation: true`.
4. External link clicks are intercepted and opened in the default browser via `shell.openExternal()`.

### IPC Channels

All IPC is handled via `ipcMain.handle()` (invoke/return) or `ipcMain.on()` (fire-and-forget).

| Channel | Direction | Purpose |
|---|---|---|
| `locale:get` | renderer → main | Get OS locale, mapped to `"he"` or `"en"` |
| `runtime:status` | renderer → main | Check Node.js ≥18, Git, and Claude binary availability |
| `project:create` | renderer → main | Create project directory, git init, copy skill files, write CLAUDE.md |
| `project:list` | renderer → main | List all projects sorted by `lastOpenedAt` |
| `project:switch` | renderer → main | Set active project, update timestamp |
| `project:update` | renderer → main | Partial update of project metadata |
| `project:get-active` | renderer → main | Get currently active project |
| `project:finalize-preferences` | renderer → main | Re-write CLAUDE.md with full user preferences after welcome flow |
| `project:open` | renderer → main | Open project directory in Finder/Explorer |
| `chat:load` | renderer → main | Load `.cc4d/chat-history.json` from project dir |
| `chat:save` | renderer → main | Atomic write (tmp + rename) of chat history |
| `preview:poll-port` | renderer → main | TCP poll a port (30s timeout) to detect dev server |
| `shell:open-external` | renderer → main | Open URL in default browser |
| `log:get-path` | renderer → main | Get electron log file path |
| `log:from-renderer` | renderer → main | Forward renderer console.error/warn to file (fire-and-forget) |

### Claude Binary Discovery

`findClaude()` searches these paths in order:
1. `~/.local/bin/claude`
2. `~/.claude/bin/claude`
3. `/usr/local/bin/claude`
4. `/opt/homebrew/bin/claude`

Both `electron/main.js` and `src/app/api/agent/route.ts` have their own `findClaude()` — the main process uses it for `runtime:status`, the API route uses it for spawning.

### Project Store

**File:** `electron/project-store.mjs`

Wraps `electron-store` with the store name `cc4d-projects`. Schema:

```
{
  projects: Array<{
    id, name, displayName, path, createdAt, lastOpenedAt,
    sessionId, locale, vibe, audience, priority, designRef,
    liveUrl, githubUrl
  }>,
  activeProjectId: string | null
}
```

Persisted to disk automatically by `electron-store` (JSON in the Electron user data directory).

Functions: `getProjects()`, `getProject(id)`, `addProject(meta)`, `updateProject(id, updates)`, `removeProject(id)`, `getActiveProject()`, `setActiveProjectId(id)`.

---

## Next.js Renderer

**Config:** `next.config.ts` — `output: "standalone"` for Electron embedding, `next-intl` plugin for i18n, `allowedDevOrigins` for dev mode cross-origin.

### Pages and Routing

The app uses a linear page flow. Users progress forward; there is no free navigation.

| Route | Page | Purpose |
|---|---|---|
| `/setup` | `src/app/setup/page.tsx` | Runtime checks (Node.js, Git, Claude). Auto-advances to `/welcome`. |
| `/welcome` | `src/app/welcome/page.tsx` | Gather idea, vibe, audience, priority, design reference. Creates project via IPC. |
| `/build` | `src/app/build/page.tsx` | Main chat + live preview. Runs the CC4D skill via Claude CLI. |
| `/ship` | `src/app/ship/page.tsx` | Deploy to Vercel/GitHub. |
| `/done` | `src/app/done/page.tsx` | Celebration screen with links to live site. |

### State Management (Zustand)

**File:** `src/lib/store.ts`

Single global store (`useAppStore`) with `persist` middleware. Key slices:

| Slice | Fields | Persisted |
|---|---|---|
| Session | `sessionId`, `projectDir`, `activeProjectId` | Yes |
| i18n | `locale` | Yes |
| Progress | `currentStep`, `phase`, `completedSteps` | Yes |
| Chat | `messages`, `isStreaming`, `messagesLoaded`, `currentActivity` | No (messages use file persistence) |
| Project | `projectName`, `liveUrl`, `githubUrl` | Partially |
| User prefs | `userName`, `vibe`, `audience`, `priority`, `designRef`, `idea` | Partially |
| Runtime | `runtimeReady`, `claudeAuthenticated` | No |
| Preview | `previewUrl`, `previewMode` | No |
| UI | `projectDrawerOpen`, `milestones` | No |

localStorage key: `cc4d-desktop-store`. Only a subset of fields is persisted (via `partialize`).

---

## Agent Communication

### SSE Route

**File:** `src/app/api/agent/route.ts`

`POST /api/agent` accepts:
```json
{ "prompt": "...", "locale": "he"|"en", "projectDir": "/path", "sessionId": "..." }
```

Behavior:
1. Resolves Claude binary via `findClaude()`.
2. Prepends Hebrew instruction if `locale === "he"`.
3. Builds args: `--print --output-format stream-json --dangerously-skip-permissions --verbose [--resume <sessionId>]`.
4. Spawns with `stdio: ["ignore", "pipe", "pipe"]` — **stdin must be `"ignore"`** or Claude hangs.
5. Deletes `CLAUDECODE` env var from child to allow nesting inside a Claude Code session.
6. Streams stdout as SSE (`data: {...}\n\n`), forwards stderr errors.
7. Sends `data: [DONE]\n\n` on process close.
8. Kills child on client disconnect (`req.signal` abort).

### Agent Client

**File:** `src/lib/agent-client.ts`

`connectToAgent()` — client-side SSE consumer.

1. POSTs to `/api/agent` with prompt, locale, projectDir, sessionId.
2. Reads the response body as a stream.
3. For each `data:` line, calls `parseAgentEvent()` to convert raw CLI JSON into `ChatMessage`.
4. Captures `session_id` from result events for `--resume`.
5. Returns `{ abort }` handle.

### Event Parsing

`parseAgentEvent(raw, locale, callbacks)` maps Claude CLI stream-json events to UI messages:

| CLI Event | UI Result |
|---|---|
| `system`, `rate_limit_event`, `user` (tool_result) | Skipped |
| `assistant` → text block | `ChatMessage` with `role: "assistant"` |
| `assistant` → `Bash` tool_use | `role: "status"` with friendly label (e.g. "Setting up your project...") |
| `assistant` → `Write`/`Edit` tool_use | `role: "status"` with filename (e.g. "Creating page.tsx...") |
| `assistant` → `Glob`/`Grep`/`Read` tool_use | `null` (filtered out — not interesting to user) |
| `assistant` → `AskUserQuestion` tool_use | `role: "assistant"` with `questionData` |
| `result` (success) | `null` (content already streamed) |
| `result` (error) or `error` | `role: "status"` error message |

### Callbacks

`AgentCallbacks` enable the build page to react to events:

| Callback | Trigger | Action |
|---|---|---|
| `onDevServerDetected` | Bash command contains `npm run dev` or `next dev` | Poll port 3000, set `previewUrl` |
| `onFileChanged` | Write/Edit tool with `file_path` | Increment `refreshTrigger` → webview reload |
| `onStepCompleted` | Bash command matches `progress.sh complete N` | Update step/phase in store |
| `onLiveUrl` | Text contains `https://...vercel.app` | Store live URL, persist to electron-store |

---

## CC4D Skill System

**Root:** `skills/cc4d/`

### State Machine

The skill uses a file-based state machine driven by `progress.sh`:

**State file:** `.cc4d-progress.json`
```json
{
  "current_step": 4,
  "completed": [1, 2, 3],
  "phase": 1
}
```

**Commands:**

| Command | Effect |
|---|---|
| `bash .cc4d/scripts/progress.sh next` | Read state, cat the current step's markdown file |
| `bash .cc4d/scripts/progress.sh complete N` | Append N to completed, advance `current_step` to N+1, recalculate phase |
| `bash .cc4d/scripts/progress.sh status` | Print summary (current step, phase, completed list) |
| `bash .cc4d/scripts/progress.sh reset` | Delete state file, reinitialize at step 1 |

Phase calculation: steps 1-2 → phase 0, steps 3-4 → phase 1, steps 5-6 → phase 2, steps 7-9 → phase 3.

### 9-Step Workflow

```
Phase 0: Setup          Phase 1: Build         Phase 2: Iterate       Phase 3: Ship
+-----------------+    +------------------+    +------------------+   +------------------+
| 1. Check Env    | →  | 3. Gather Idea   | →  | 5. React/Iterate | → | 7. Offer to Ship |
| 2. Orient User  |    | 4. Scaffold+Build|    | 6. Save Progress |   | 8. Push+Deploy   |
+-----------------+    +------------------+    +------------------+   | 9. Celebrate     |
                                                      ↑       |      +------------------+
                                                      +-------+
                                                   (feedback loop)
```

| Step | File | Purpose |
|---|---|---|
| 1 | `01-check-environment.md` | Verify Node.js, Git, Claude CLI |
| 2 | `02-orient-user.md` | Greet user, explain what's about to happen |
| 3 | `03-gather-idea.md` | Use AskUserQuestion to collect idea, vibe, audience |
| 4 | `04-scaffold-and-build.md` | `npx create-next-app`, build first version |
| 5 | `05-react-and-iterate.md` | Show site, gather feedback, iterate |
| 6 | `06-save-progress.md` | Git commit, update CLAUDE.md |
| 7 | `07-offer-to-ship.md` | Ask if user wants to publish |
| 8 | `08-push-and-deploy.md` | GitHub repo + Vercel deploy |
| 9 | `09-celebrate.md` | Show live URL, celebrate |

Each step file has three sections:
- **ACTION** — what Claude should do
- **CHECK** — verification condition
- **CAPTURE** — what to save to CLAUDE.md

### References

- `references/feedback-cheatsheet.md` — Agentation patterns, feedback phrases, plan mode guide
- `references/shipping-reference.md` — GitHub/Vercel CLI commands, auto-deploy explanation

---

## Desktop ↔ CC4D Integration

The desktop app pre-completes steps 1-3 during its onboarding flow, so Claude starts at step 4 with all preferences already captured.

### Project Creation Flow

The welcome page uses a two-phase approach: create the project directory first (with empty idea), then finalize preferences after the user answers all questions.

```
User arrives at /welcome, answers preference questions
       |
       v
User clicks "Start Building"
       |
       v
electronAPI.createProject("", locale)         ← Phase 1: scaffold
       |
       v (IPC: project:create)
electron/main.js:
  1. slug = "new-project" (idea is empty)
  2. deduplicatePath() → unique name
  3. mkdir ~/Documents/Claude Projects/<name>/
  4. git init (via dugite)
  5. copySkillFiles(skills/cc4d → .cc4d/)
  6. writeProjectClaudeMd(projectPath, null):
     - Read SKILL.md, strip YAML frontmatter
     - Rewrite paths: scripts/ → .cc4d/scripts/
     - Write → CLAUDE.md (no preferences yet)
  7. initProgressState():
     - Write .cc4d-progress.json
       {current_step: 4, completed: [1,2,3], phase: 1}
  8. Store metadata in electron-store
  9. Return ProjectMeta
       |
       v
electronAPI.finalizePreferences(meta.id, {    ← Phase 2: preferences
  idea, vibe, audience, priority, designRef
})
       |
       v (IPC: project:finalize-preferences)
electron/main.js:
  1. Re-write CLAUDE.md with full preferences appended:
     - Idea, Style/Vibe, Audience, Priority, Design reference
     - "Steps 1-3 pre-completed by desktop app" note
  2. Re-write .cc4d-progress.json (same state, step 4)
  3. Persist preferences to electron-store
       |
       v
store.setStep(4, 1) → router.push("/build")
       |
       v
Auto-send initial prompt:
  formatInitialMessage({idea, vibe, audience, priority, designRef, locale})
       |
       v
Claude reads CLAUDE.md, runs progress.sh next, begins Step 4
```

### CLAUDE.md Rewriting

`writeProjectClaudeMd()` transforms the skill's `SKILL.md` into a project-local `CLAUDE.md`:

1. Strips YAML frontmatter (`---...---`).
2. Rewrites relative paths: `scripts/` → `.cc4d/scripts/`, `references/` → `.cc4d/references/`, `steps/` → `.cc4d/steps/`.
3. Appends a "Desktop App Note" section explaining steps 1-3 are pre-completed.
4. Appends a "What we know" section with user preferences.

### Progress Sync

The build page watches for progress events via `AgentCallbacks.onStepCompleted`:

1. `parseAgentEvent()` regex-matches `progress.sh complete N` in Bash tool_use commands.
2. Fires `onStepCompleted(N)`.
3. Build page calls `store.completeStep(N)` and `store.setStep(N+1, phase)`.
4. The `StepIndicator` component reflects the updated progress.

---

## Message Lifecycle

```
User types message
       |
       v
ChatPanel → handleSend(message)
       |
       v
store.addMessage({role:"user", content, timestamp})
       |
       v
connectToAgent({prompt, locale, projectDir, sessionId})
       |
       v
fetch POST /api/agent ──────────────────────► route.ts
                                                  |
                                          spawn claude CLI
                                                  |
◄──────────── SSE stream ─────────────────────────┘
  data: {"type":"assistant","message":{content:[{text}]}}
  data: {"type":"assistant","message":{content:[{tool_use}]}}
  data: {"type":"result","session_id":"..."}
  data: [DONE]
       |
       v
parseAgentEvent(raw, locale, callbacks)
  ├─ assistant text  → {role:"assistant", content}
  ├─ Bash tool_use   → {role:"status", content:"friendly label"}
  ├─ Write tool_use  → {role:"status", content:"Creating file..."}
  ├─ Edit tool_use   → {role:"status", content:"Editing file..."}
  ├─ AskUserQuestion → {role:"assistant", questionData}
  ├─ Glob/Grep/Read  → null (filtered, not shown)
  └─ result          → captures session_id, returns null
       |
       v
store.addMessage(parsed)
       |
       v
buildActivityBlocks(messages) → ActivityBlock[]
  ├─ "user-input" blocks
  ├─ "assistant" blocks (markdown rendered)
  ├─ "building" blocks (collapsible, file list)
  ├─ "question" blocks (QuestionCard UI)
  └─ "error" blocks
       |
       v
ChatHistory renders blocks
       |
       v (debounced 500ms)
electronAPI.saveChatHistory() → IPC → .cc4d/chat-history.json
```

### Activity Blocks

**File:** `src/lib/activity-blocks.ts`

Messages are grouped into `ActivityBlock[]` for display. Consecutive messages of the same type merge:

| Block Type | Merge Rule | Contains |
|---|---|---|
| `user-input` | One per user message | User's text |
| `assistant` | Consecutive assistant texts merge | Markdown content |
| `building` | Consecutive status messages merge | File list, tool commands |
| `question` | One per AskUserQuestion | Question cards with options |
| `error` | One per error | Error status message |

Two modes: `buildActivityBlocks()` for full rebuild (on load), `appendToBlocks()` for incremental append (during streaming).

### Chat Persistence

**File:** `src/lib/use-chat-persistence.ts`

- **Load:** On mount or project change, reads `.cc4d/chat-history.json` via IPC (`chat:load`).
- **Save:** Debounced 500ms after any `messages` change, writes via IPC (`chat:save`). Uses atomic write (tmp file + rename).
- Falls back gracefully in dev mode without Electron.

---

## Logging Architecture

Four log categories, all written to `~/.claude-for-beginners/logs/`:

| File | Source | Writer | Contents |
|---|---|---|---|
| `electron.log` | Main process | `electron-log` | App lifecycle, IPC, window events, Next.js server |
| `agent.log` | API route | `src/lib/logger.ts` (`agentLog`) | Claude CLI spawn, SSE events, session lifecycle |
| `agent-debug.log` | API route | `src/lib/logger.ts` (`debugLog`) | Raw CLI JSON payloads |
| `app.log` | Next.js server | `src/lib/logger.ts` (`appLog`) | General app-level logs |
| `renderer.log` | Browser | IPC `log:from-renderer` | `console.error`, `console.warn`, uncaught exceptions |

### Rotation

- **electron.log:** `electron-log` auto-rotates, keeps `electron.log` + `electron.old.log`. 5 MB max.
- **Server-side logs (agent, app):** `logger.ts` rotates at 5 MB, keeps up to 5 numbered files (`.1` through `.5`).
- **renderer.log:** Main process handles rotation at 5 MB, keeps one `.old` backup.

### Renderer Logger

**File:** `src/lib/renderer-logger.ts`

Patches `console.error` and `console.warn` in the browser to forward messages to the main process via IPC. Also captures `window.error` and `unhandledrejection` events. Imported once in the root layout.

### Server-Side Logger

**File:** `src/lib/logger.ts`

Category-based file logger. `createLogger(category)` returns `{ debug, info, warn, error }`. Each call appends a timestamped line to `~/.claude-for-beginners/logs/<category>.log`. Auto-cleans log files older than 7 days on module load.

---

## Build & Packaging

**Config:** `electron-builder.yml`

| Field | Value |
|---|---|
| `appId` | `dev.the-shift.claude-for-beginners` |
| `productName` | Claude for Beginners |
| `output` | `build/` |
| `files` | `electron/**/*`, `.next/standalone/**/*`, `.next/static/**/*`, `public/**/*`, `messages/**/*` |
| `extraResources` | Bundled Node.js, Git, and `skills/cc4d` → `cc4d-skill` |

### Platform Targets

| Platform | Format | Arch |
|---|---|---|
| macOS | DMG | arm64, x64 |
| Windows | NSIS installer | x64 |
| Linux | AppImage | — |

### Production Packaging

In production, the skill files are bundled as an extra resource at `process.resourcesPath/cc4d-skill`. `getSkillSourceDir()` switches between the dev path (`../../skills/cc4d`) and the packaged path based on `app.isPackaged`.

The Next.js app is pre-built with `output: "standalone"`, producing a self-contained `server.js` that the main process spawns on a random port at startup.

### Publishing

GitHub Releases via `electron-builder`'s `publish.provider: github`.

---

## Key Files Index

| Area | File | Purpose |
|---|---|---|
| Electron main | `electron/main.js` | Window lifecycle, IPC handlers, project creation |
| Preload bridge | `electron/preload.js` | `window.electronAPI` surface |
| Project store | `electron/project-store.mjs` | `electron-store` wrapper for project metadata |
| Project utils | `electron/project-utils.js` | `slugifyIdea()`, `deduplicatePath()` |
| Agent route | `src/app/api/agent/route.ts` | SSE endpoint, Claude CLI spawning |
| Agent client | `src/lib/agent-client.ts` | Client-side SSE consumer, event parsing |
| App store | `src/lib/store.ts` | Zustand global state |
| Chat persistence | `src/lib/use-chat-persistence.ts` | Load/save chat via IPC |
| Activity blocks | `src/lib/activity-blocks.ts` | Message → visual block grouping |
| Server logger | `src/lib/logger.ts` | File-based category logger |
| Renderer logger | `src/lib/renderer-logger.ts` | Patches console.error/warn → IPC |
| Debug store | `src/lib/debug-store.ts` | Raw event store for debug terminal |
| Setup page | `src/app/setup/page.tsx` | Runtime checks |
| Welcome page | `src/app/welcome/page.tsx` | Onboarding, preference collection |
| Build page | `src/app/build/page.tsx` | Chat + preview, agent orchestration |
| Ship page | `src/app/ship/page.tsx` | Deployment flow |
| Done page | `src/app/done/page.tsx` | Celebration |
| Live preview | `src/components/preview/LivePreview.tsx` | Webview/iframe for localhost preview |
| Skill master | `skills/cc4d/SKILL.md` | CC4D skill instructions (becomes CLAUDE.md) |
| Progress script | `skills/cc4d/scripts/progress.sh` | State machine driver |
| Step files | `skills/cc4d/steps/01-09-*.md` | Individual step instructions |
| Next config | `next.config.ts` | Standalone output, i18n, dev origins |
| Builder config | `electron-builder.yml` | Packaging targets and resources |
