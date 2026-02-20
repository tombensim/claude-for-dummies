# CC4D Desktop — Refactoring Opportunities

**Date:** 2026-02-20
**Scope:** `desktop/` — Electron app (Next.js + React + Zustand + Tailwind v4)
**Total files analyzed:** ~60 source files, ~5,500 LOC

---

## Table of Contents

1. [Critical: Security Issues](#1-critical-security-issues)
2. [High: Architecture — God Components & God Functions](#2-high-architecture--god-components--god-functions)
3. [High: Error Handling Gaps](#3-high-error-handling-gaps)
4. [High: Type Safety Gaps](#4-high-type-safety-gaps)
5. [Medium: State Management](#5-medium-state-management)
6. [Medium: Repeated Patterns — Extract Shared Abstractions](#6-medium-repeated-patterns--extract-shared-abstractions)
7. [Medium: Performance](#7-medium-performance)
8. [Low: Magic Strings & Numbers](#8-low-magic-strings--numbers)
9. [Low: Accessibility](#9-low-accessibility)
10. [Low: CSS/Tailwind](#10-low-csstailwind)

---

## 1. Critical: Security Issues

### SEC-1: `shell:open-external` — no URL protocol validation
**File:** `electron/ipc-handlers.js:77-79`
**What's wrong:** `shell.openExternal(url)` is called with a renderer-supplied URL and no protocol check. A compromised page or XSS could invoke arbitrary URI scheme handlers (`file://`, `smb://`, custom schemes).
**Fix:** Validate `url.startsWith("https://") || url.startsWith("http://")` before calling `openExternal`.
**Priority:** Critical | **Effort:** 5 min

### SEC-2: `file:copy-to-project` — arbitrary file read via renderer
**File:** `electron/ipc-handlers.js:432-458`
**What's wrong:** Each `src` path in `filePaths` is passed directly to `fs.copyFileSync` from the renderer. No verification that paths came from `dialog.showOpenDialog`. A renderer exploit could copy `/etc/passwd` or SSH keys into the project.
**Fix:** Either validate that paths came from a prior dialog call (track dialog results), or restrict to allowed parent directories.
**Priority:** Critical | **Effort:** 30 min

### SEC-3: `project:open` — no path validation
**File:** `electron/ipc-handlers.js:72-74`
**What's wrong:** `shell.openPath(projectPath)` uses a renderer-supplied path with no validation against known project paths.
**Fix:** Validate `projectPath` exists in `projectStore.get("projects")` before opening.
**Priority:** Critical | **Effort:** 10 min

### SEC-4: Image save path traversal in API route
**File:** `src/app/api/agent/route.ts:43-53`
**What's wrong:** `projectDir` from `req.json()` is used as-is to construct `uploadsDir`. A caller could supply `projectDir: "/etc"` or paths with `../` and write files anywhere.
**Fix:** Resolve the path and validate it falls within `~/Documents/Claude Projects/`.
**Priority:** Critical | **Effort:** 15 min

### SEC-5: `env:load` / `env:save` — path not validated
**File:** `electron/ipc-handlers.js:350-385`
**What's wrong:** `projectPath` from renderer is used to read/write `.env.local` at arbitrary locations. Env var keys are not validated against `[A-Z_][A-Z0-9_]*`, allowing format corruption via keys containing `=` or newlines.
**Fix:** Validate `projectPath` against known project paths. Validate env key format.
**Priority:** Critical | **Effort:** 20 min

### SEC-6: `webviewTag: true` with no navigation guard
**File:** `electron/main.js:116-122`
**What's wrong:** Enabling `webviewTag` is a known Electron security risk. No `will-attach-webview` or `will-navigate` handler restricts navigation.
**Fix:** Add `webContents.on("will-attach-webview", ...)` to restrict webview creation and whitelisted URLs.
**Priority:** High | **Effort:** 30 min

### SEC-7: Prompt passed as raw CLI argument with no guards
**File:** `src/app/api/agent/route.ts:92-104`
**What's wrong:** User prompt string is passed directly as a positional argument to `spawn`. No length check, no null-byte stripping, no guard against `--` prefix being misinterpreted as a flag.
**Fix:** Add basic input sanitization and length caps. Consider using stdin instead of argument.
**Priority:** High | **Effort:** 20 min

---

## 2. High: Architecture — God Components & God Functions

### ARCH-1: `parseAgentEvent` — 287-line megafunction
**File:** `src/lib/agent-client.ts:150-437`
**What's wrong:** Handles 7+ responsibilities: system event skipping, user/assistant text parsing, URL detection, question detection, tool_use routing for 6+ tool types, result handling, error handling. Returns early from a `for` loop, silently dropping subsequent content blocks.
**Fix:** Split into `parseTextBlock`, `parseToolUseBlock`, `parseResultBlock`, `parseErrorBlock`. Create a tool handler registry keyed by tool name.
**Priority:** High | **Effort:** 2-3 hours

### ARCH-2: `setupIPC` — 427-line monolith
**File:** `electron/ipc-handlers.js:41-468`
**What's wrong:** Every IPC handler in the app is registered inline in a single function. Impossible to test in isolation.
**Fix:** Split into domain modules: `project-handlers.js`, `chat-handlers.js`, `env-handlers.js`, `file-handlers.js`, `preview-handlers.js`. Each exports a `register(ipcMain, projectStore)` function.
**Priority:** High | **Effort:** 2 hours

### ARCH-3: `BuildPage` — 355-line god component
**File:** `src/app/build/page.tsx`
**What's wrong:** Manages agent lifecycle, session recovery, milestone persistence, dev server polling, phase transitions, project drawer state, and layout rendering. `sendToAgent` alone is 127 lines inline (lines 136-263).
**Fix:** Extract `useAgentSession(callbacks)` hook for the agent connection lifecycle. Extract `useProjectRecovery()` for the IPC recovery logic. Extract `usePendingMessage(sendFn)` for the queued message watcher.
**Priority:** High | **Effort:** 2-3 hours

### ARCH-4: `connectToAgent` — streaming logic embedded in 107-line `.then()` callback
**File:** `src/lib/agent-client.ts:442-549`
**What's wrong:** Buffer management, SSE parsing, block-count dedup, activity updates, and session ID capture all in one place. Silent `catch` swallows all parse errors (line 529).
**Fix:** Extract SSE line parser, extract block dedup logic, add error logging in catch block.
**Priority:** High | **Effort:** 1.5 hours

### ARCH-5: `spawnClaude` — 137-line function nested inside a `ReadableStream` constructor
**File:** `src/app/api/agent/route.ts:111-248`
**What's wrong:** Spawning, stdout buffering, line parsing, log enrichment, error emission, resume-retry logic, and abort-signal wiring all in one function, inside a `ReadableStream.start` callback.
**Fix:** Extract to standalone `spawnClaude(args, controller, encoder, logger)` function.
**Priority:** High | **Effort:** 1.5 hours

### ARCH-6: `SetupPage` — 70-line async polling sequence inline in useEffect
**File:** `src/app/setup/page.tsx:33-131`
**What's wrong:** Multi-step async `runChecks` with nested `markChecking`/`markDone`/`markActionNeeded` helpers all inside a `useEffect`. Seven hardcoded timeouts and magic retry counts.
**Fix:** Extract to `useSetupChecks()` hook returning `{ items, allDone, progress }`.
**Priority:** Medium | **Effort:** 1 hour

### ARCH-7: `ShipPage` — agent connection with raw event parsing inline
**File:** `src/app/ship/page.tsx:38-122`
**What's wrong:** `handleShip` is 84 lines with `connectToAgent` callbacks and raw stream JSON parsing for deploy step detection.
**Fix:** Extract `useShipAgent()` hook and `parseDeployStepFromEvent(raw)` utility.
**Priority:** Medium | **Effort:** 1 hour

---

## 3. High: Error Handling Gaps

### ERR-1: Silent catch swallows all SSE parse errors
**File:** `src/lib/agent-client.ts:529-531`
**What's wrong:** `catch {}` silently discards JSON parse failures, null-deref inside `parseAgentEvent`, and callback exceptions. Any malformed server event is invisible.
**Fix:** Log the error (at minimum `console.warn`). Consider forwarding parse failures to a debug store event.
**Priority:** High | **Effort:** 10 min

### ERR-2: HTTP error response body never read
**File:** `src/lib/agent-client.ts:472-475`
**What's wrong:** On non-200 response, only `res.status` is reported. The response body (which may contain a server-side error message) is discarded.
**Fix:** Read `res.text()` and include in the error callback.
**Priority:** High | **Effort:** 10 min

### ERR-3: Infinite Next.js server-ready loop with no timeout
**File:** `electron/main.js:84-95`
**What's wrong:** `check()` retries every 200ms with no max attempt count or timeout. If Next.js exits immediately, this loop runs forever and `app.whenReady()` never resolves.
**Fix:** Add a max attempt count (e.g., 150 attempts = 30 seconds) and reject on exhaustion.
**Priority:** High | **Effort:** 15 min

### ERR-4: `app.whenReady()` has no error handler
**File:** `electron/main.js:158-175`
**What's wrong:** If `startNextServer()` rejects, the unhandled promise rejection silently freezes the app.
**Fix:** Add `.catch()` with user-facing error dialog or graceful shutdown.
**Priority:** High | **Effort:** 15 min

### ERR-5: Renderer log handler swallows all errors silently
**File:** `electron/ipc-handlers.js:93-104`
**What's wrong:** `fs.appendFileSync` failure is completely swallowed. Disk-full scenario = silent data loss.
**Fix:** At minimum, `console.warn` the error.
**Priority:** Medium | **Effort:** 5 min

### ERR-6: No `.catch` on IPC load calls across project components
**Files:** `ProjectEnvVars.tsx:23`, `ProjectInspirations.tsx:20`
**What's wrong:** `loadEnvVars` and `loadInspirations` have no `.catch()`. Load failures are invisible to the user.
**Fix:** Add `.catch()` with user-visible error state or at minimum console.error.
**Priority:** Medium | **Effort:** 15 min

### ERR-7: Fire-and-forget IPC saves — store/disk divergence
**Files:** `ProjectEnvVars.tsx:31,44`, `ProjectInspirations.tsx:28`, `ProjectIdentityCard.tsx:42-44`
**What's wrong:** Save calls are fire-and-forget with no error handling. Store updates optimistically but disk may fail, leaving state out of sync.
**Fix:** Await saves and revert on failure, or at minimum log errors.
**Priority:** Medium | **Effort:** 30 min

### ERR-8: `onPreviewReady` fires twice for same URL
**File:** `src/lib/agent-client.ts:173-182`
**What's wrong:** If text contains both a localhost URL and "ready in", callback fires twice. Second `if` should be `else if`.
**Fix:** Change to `else if`.
**Priority:** Medium | **Effort:** 2 min

### ERR-9: `req.json()` not wrapped in try/catch in API route
**File:** `src/app/api/agent/route.ts:60-61`
**What's wrong:** Malformed request body throws unhandled rejection, returning 500 with no SSE error to the client.
**Fix:** Wrap in try/catch, return a structured error response.
**Priority:** Medium | **Effort:** 10 min

### ERR-10: `navigator.clipboard.writeText` rejection not caught
**File:** `src/app/done/page.tsx:35`
**What's wrong:** Clipboard API call is not awaited and rejection is silently swallowed. No user feedback on success or failure.
**Fix:** `await` and catch, show toast on success/failure.
**Priority:** Low | **Effort:** 10 min

### ERR-11: `isCreating` state never reset on navigation failure
**File:** `src/app/welcome/page.tsx:88`
**What's wrong:** After `router.push("/build")`, if navigation fails, the "Start" button stays permanently disabled.
**Fix:** Reset in a `.finally()` or use router events.
**Priority:** Low | **Effort:** 10 min

---

## 4. High: Type Safety Gaps

### TYPE-1: `parseAgentEvent` — entire event typed as `Record<string, unknown>` with unsafe casts
**File:** `src/lib/agent-client.ts:150-437`
**What's wrong:** All event fields are accessed via `as string`, `as Array<...>` etc. with no runtime guards. `block.name as string` could be `undefined`. `toolInput as ChatMessage["questionData"]` bypasses structural validation.
**Fix:** Define discriminated union types for Claude stream events. Use Zod or manual type guards.
**Priority:** High | **Effort:** 2 hours

### TYPE-2: API route request body is untyped
**File:** `src/app/api/agent/route.ts:60`
**What's wrong:** `prompt`, `images`, `locale`, `projectDir`, `sessionId` are all `any` after destructuring `req.json()`. No runtime validation.
**Fix:** Add a Zod schema or manual type guards for the request payload.
**Priority:** High | **Effort:** 30 min

### TYPE-3: Streamed `parsed` object is `any` throughout stdout handler
**File:** `src/app/api/agent/route.ts:144-154`
**What's wrong:** `parsed.type`, `parsed.subtype`, `parsed.num_turns`, etc. are all accessed on an untyped object.
**Fix:** Define Claude stream event types and validate/narrow after `JSON.parse`.
**Priority:** High | **Effort:** 1 hour

### TYPE-4: IPC types use `unknown[]` where concrete types exist
**File:** `src/types/electron-api.d.ts:38-41, 60-64`
**What's wrong:** `loadChatHistory` returns `Promise<unknown[]>`, `saveChatHistory` accepts `unknown[]`, same for milestones. Forces `as unknown[]` casts at call sites (`use-chat-persistence.ts:61`).
**Fix:** Use `ChatMessage[]` and `ProjectMilestone[]` in the type definitions.
**Priority:** Medium | **Effort:** 15 min

### TYPE-5: Triple `as unknown as` casts for webview ref
**File:** `src/components/preview/LivePreview.tsx:26, 47, 100`
**What's wrong:** `(webviewRef.current as unknown as { reload: () => void })?.reload?.()` appears 3 times. Indicates ref type is fundamentally wrong.
**Fix:** Type ref as `HTMLIFrameElement | null` with a guarded cast for the Electron `reload()` method.
**Priority:** Medium | **Effort:** 15 min

### TYPE-6: `ProjectMeta.locale` typed as `string` vs `AppState.locale` as `"he" | "en"`
**File:** `src/lib/store.ts:45 vs 61`
**What's wrong:** Type mismatch between project metadata and app state. `loadProject` discards `meta.locale` entirely — silent data loss.
**Fix:** Align types. Use `"he" | "en"` in `ProjectMeta`.
**Priority:** Medium | **Effort:** 10 min

### TYPE-7: `toolInput` access without string narrowing in milestone extractor
**File:** `src/lib/milestone-extractor.ts:20, 54`
**What's wrong:** `msg.toolInput?.command` and `.file_path` are accessed as strings without `typeof` check. If they're numbers or objects, `.includes()` / `.split()` will throw.
**Fix:** Add `typeof` guards before string operations.
**Priority:** Medium | **Effort:** 10 min

### TYPE-8: Entire `electron/ipc-handlers.js` is untyped
**File:** `electron/ipc-handlers.js` (470 lines)
**What's wrong:** Plain JS with no JSDoc types. All IPC handler parameters are untyped. Callers in TypeScript can pass mismatched types with no compile-time error.
**Fix:** Either convert to TypeScript or add comprehensive JSDoc `@param` annotations.
**Priority:** Medium | **Effort:** 2 hours (JSDoc) or 4 hours (TS conversion)

### TYPE-9: `ChatMessage.toolInput` is a weak partial type
**File:** `src/lib/store.ts:28-29`
**What's wrong:** `toolInput?: { file_path?: string; command?: string }` — a catch-all that doesn't distinguish between tool types. Should be a discriminated union keyed on `toolName`.
**Fix:** Define per-tool input types and use a discriminated union.
**Priority:** Low | **Effort:** 1 hour

---

## 5. Medium: State Management

### STATE-1: Zustand store is a flat monolith with 30+ fields and 30+ actions
**File:** `src/lib/store.ts:54-270`
**What's wrong:** Session, progress, chat, UI, and project-metadata concerns all live in one flat store. No slices. Hard to test or maintain individually.
**Fix:** Split into Zustand slices: `session`, `progress`, `chat`, `ui`, `projectMeta`. Use `create` with slice combinators.
**Priority:** Medium | **Effort:** 3-4 hours

### STATE-2: Three pages subscribe to entire store with no selector
**Files:** `ship/page.tsx:23`, `done/page.tsx:16`, `welcome/page.tsx:53`
**What's wrong:** `const store = useAppStore()` — subscribes to all 30+ fields. Re-renders on every `messages` append, every `currentActivity` update, every `isStreaming` toggle, even when the page uses only 3-8 fields.
**Fix:** Use field-level selectors: `const liveUrl = useAppStore((s) => s.liveUrl)`.
**Priority:** Medium | **Effort:** 30 min per page

### STATE-3: `phase` stored separately but always derivable from `currentStep`
**File:** `src/lib/store.ts:64-65, 111`
**What's wrong:** `phase` is stored alongside `currentStep` but is always `getPhaseForStep(currentStep)`. `setStep(step, phase)` forces callers to manually pass the computed phase, risking drift (e.g., `setStep(9, 3)` with wrong phase literal).
**Fix:** Remove `phase` from store. Replace with a selector: `const phase = useAppStore(s => getPhaseForStep(s.currentStep))`.
**Priority:** Medium | **Effort:** 1 hour

### STATE-4: `messagesLoaded` is global store state but only used by one hook
**File:** `src/lib/store.ts:75`, `src/lib/use-chat-persistence.ts:9-10`
**What's wrong:** `messagesLoaded` is a flag in the global store but only consumed by `useChatPersistence`. It belongs as `useState` in that hook.
**Fix:** Move to local state in `useChatPersistence`.
**Priority:** Low | **Effort:** 15 min

### STATE-5: Persistence config has no version or migration strategy
**File:** `src/lib/store.ts:251`
**What's wrong:** `persist` middleware uses key `"cc4d-desktop-store"` with no `version` or `migrate` option. Any future shape change silently loads stale data.
**Fix:** Add `version: 1` and a `migrate` function.
**Priority:** Medium | **Effort:** 30 min

### STATE-6: Inconsistent persistence — `audience`, `priority`, `designRef` not persisted
**File:** `src/lib/store.ts:252-267`
**What's wrong:** `vibe` and `idea` are persisted, but `audience`, `priority`, and `designRef` are not, despite being set in the same user flow. Resuming the app loses these values.
**Fix:** Either persist all project-meta fields or none (rely solely on the per-project `.cc4d/` files).
**Priority:** Low | **Effort:** 10 min

### STATE-7: `isWorkspaceMode` persisted but re-derived on every `loadProject`
**File:** `src/lib/store.ts:222, 258`
**What's wrong:** `isWorkspaceMode` is persisted to localStorage but `loadProject` re-derives it from `meta.sessionId`. Persisted value can be stale.
**Fix:** Remove from persistence whitelist since it's always re-derived.
**Priority:** Low | **Effort:** 5 min

---

## 6. Medium: Repeated Patterns — Extract Shared Abstractions

### DRY-1: Duplicate IPC load/save lifecycle in project components
**Files:** `ProjectEnvVars.tsx:21-33`, `ProjectInspirations.tsx:18-29`, `use-chat-persistence.ts`
**What's wrong:** Three components implement identical patterns: `useEffect` loads data on `projectDir` change, a save function does optimistic local state update + fire-and-forget IPC call.
**Fix:** Extract `useIPCData<T>(projectDir, loadFn, saveFn, emptyValue)` hook.
**Priority:** Medium | **Effort:** 1 hour

### DRY-2: Duplicate Write/Edit tool handling in `parseAgentEvent`
**File:** `src/lib/agent-client.ts:296-344`
**What's wrong:** Write (lines 296-319) and Edit (lines 322-344) handlers are identical except for the locale string ("Creating" vs "Editing").
**Fix:** Merge into `handleFileToolEvent(toolName, filePath, locale)`.
**Priority:** Medium | **Effort:** 15 min

### DRY-3: Duplicate error response construction in `parseAgentEvent`
**File:** `src/lib/agent-client.ts:401-433`
**What's wrong:** Identical error result objects constructed in two places (lines 401-413 and 421-433).
**Fix:** Extract `makeErrorResult(locale, timestamp)` helper.
**Priority:** Low | **Effort:** 10 min

### DRY-4: Three identical JSON load/save IPC handler pairs
**File:** `electron/ipc-handlers.js:210-326`
**What's wrong:** `chat`, `milestones`, and `inspirations` handlers are structurally identical: load calls `loadJsonFile`, save calls `saveJsonFileAtomic`.
**Fix:** Factory function: `registerJsonStore(ipcMain, name, filename, fallback)`.
**Priority:** Medium | **Effort:** 30 min

### DRY-5: Duplicate TCP port probing
**Files:** `electron/main.js:86-94`, `electron/ipc-handlers.js:291-301`
**What's wrong:** Both files implement "try connecting to port, retry on failure" independently.
**Fix:** Extract to `electron/port-utils.js` with `waitForPort(port, opts)`.
**Priority:** Low | **Effort:** 20 min

### DRY-6: Five identical milestone object literal constructions
**File:** `src/lib/milestone-extractor.ts:24-80`
**What's wrong:** Pattern `{ id: uid(), type, label: locale === "he" ? heLabel : enLabel, timestamp: now }` repeated 5 times.
**Fix:** Extract `makeMilestone(type, heLabel, enLabel, now)` factory.
**Priority:** Low | **Effort:** 15 min

### DRY-7: Repeated `motion.div` fade-in animation props
**File:** `src/app/done/page.tsx:85-137`
**What's wrong:** Three `motion.*` elements with near-identical `initial/animate/transition` props differing only in `delay`.
**Fix:** Define a `fadeUp(delay)` variant factory at the top of the file.
**Priority:** Low | **Effort:** 10 min

---

## 7. Medium: Performance

### PERF-1: `DebugTerminal` — `JSON.stringify` inside unmemorized filter loop
**File:** `src/components/debug/DebugTerminal.tsx:107-112`
**What's wrong:** `filtered` is recomputed on every render. The filter predicate calls `JSON.stringify(event.raw)` for every event — O(n * event_size). Not memoized.
**Fix:** Wrap in `useMemo([events, filter])`.
**Priority:** Medium | **Effort:** 5 min

### PERF-2: `DebugTerminal` — `EventRow` not `React.memo`
**File:** `src/components/debug/DebugTerminal.tsx:64, 194`
**What's wrong:** When new events arrive, all existing `EventRow` instances re-render. No `React.memo` on the component.
**Fix:** Wrap `EventRow` in `React.memo`.
**Priority:** Medium | **Effort:** 5 min

### PERF-3: `DEPLOY_STEPS` array created per-render per-item
**File:** `src/app/ship/page.tsx:194-212`
**What's wrong:** `["saving", "publishing", "done"]` array literal created inside `.map()` callback — new array on every render for every item.
**Fix:** Extract as module-level `const DEPLOY_STEPS = ["saving", "publishing", "done"] as const`.
**Priority:** Low | **Effort:** 5 min

### PERF-4: Nine individual store selectors in `ProjectChoicesCard`
**File:** `src/components/project/ProjectChoicesCard.tsx:84-90`
**What's wrong:** Nine separate `useAppStore` calls cause independent re-render subscriptions. Any of the 7 value subscriptions firing re-renders all three `PillGroup` instances.
**Fix:** Use `useShallow` with a single object selector.
**Priority:** Low | **Effort:** 10 min

### PERF-5: Missing `useCallback` on event handlers in ChatInput
**File:** `src/components/chat/ChatInput.tsx:115-150`
**What's wrong:** `handlePaste`, `handleDrop`, `handleDragOver`, `handleFileSelect`, `removeImage` are plain functions re-created on every keystroke (controlled input).
**Fix:** Wrap in `useCallback`.
**Priority:** Low | **Effort:** 15 min

### PERF-6: `deployMessages` object recreated every render
**File:** `src/app/ship/page.tsx:128-133`
**What's wrong:** Object with `t(...)` calls recreated on every render.
**Fix:** Wrap in `useMemo`.
**Priority:** Low | **Effort:** 5 min

### PERF-7: Stale locale in milestone throttler
**File:** `src/app/build/page.tsx:44`
**What's wrong:** `createMilestoneThrottler(store.locale)` is in a `useRef` — never recreated when locale changes.
**Fix:** Reinitialize throttler when locale changes, or accept locale as a parameter in each call.
**Priority:** Low | **Effort:** 10 min

---

## 8. Low: Magic Strings & Numbers

### MAGIC-1: Hardcoded step numbers throughout `agent-client.ts`
**File:** `src/lib/agent-client.ts:213, 257, 261, 269, 275, 301, 325, 375`
**What's wrong:** `onStepHint?.(9)`, `onStepHint?.(5)`, `onStepHint?.(4)`, etc. scattered with only inline comments. `progress-config.ts` already exists but defines no named step constants.
**Fix:** Add named constants to `progress-config.ts`: `STEPS.GATHER_IDEA = 3`, `STEPS.SCAFFOLD = 4`, etc.
**Priority:** Medium | **Effort:** 30 min

### MAGIC-2: Seven hardcoded timeouts in `setup/page.tsx`
**File:** `src/app/setup/page.tsx:64, 80, 95, 96, 112, 119, 127`
**What's wrong:** `setTimeout(r, 400)`, `setTimeout(r, 3000)`, `attempt < 10`, `setTimeout(r, 2000)`, `setTimeout(r, 1200)` — all bare numbers.
**Fix:** Named constants: `READY_DELAY`, `RECHECK_DELAY`, `MAX_AUTH_ATTEMPTS`, `AUTH_POLL_INTERVAL`, `AUTO_ADVANCE_DELAY`.
**Priority:** Low | **Effort:** 15 min

### MAGIC-3: Port `3000` repeated four times in `build/page.tsx`
**File:** `src/app/build/page.tsx:108, 119, 208, 211`
**What's wrong:** Port number hardcoded in four places.
**Fix:** `const DEFAULT_DEV_PORT = 3000`.
**Priority:** Low | **Effort:** 5 min

### MAGIC-4: Hardcoded Hebrew/English prompt strings in page components
**Files:** `build/page.tsx:27-28`, `ship/page.tsx:41-43`, `build/page.tsx:198-201, 273-276`
**What's wrong:** User-facing strings inline in component files instead of i18n translation files.
**Fix:** Move to `messages/en.json` and `messages/he.json`, access via `useTranslations`.
**Priority:** Low | **Effort:** 30 min

### MAGIC-5: `"CLAUDE.md"` and `"progress.sh"` filter strings
**File:** `src/lib/agent-client.ts:300, 325`
**What's wrong:** Used as file-skip filters with no named constant.
**Fix:** `const IGNORED_FILE_PATTERNS = ["CLAUDE.md", "progress.sh"]`.
**Priority:** Low | **Effort:** 5 min

### MAGIC-6: DebugTerminal strings not in i18n
**File:** `src/components/debug/DebugTerminal.tsx:134, 190-191`
**What's wrong:** `"Debug Terminal"`, `"Waiting for events..."`, `"No events match filter."` are hardcoded English.
**Fix:** Either accept this for a dev-only tool, or add to i18n.
**Priority:** Low | **Effort:** 15 min

---

## 9. Low: Accessibility

### A11Y-1: Delete button invisible to keyboard users
**File:** `src/app/welcome/page.tsx:200-210`
**What's wrong:** Delete button uses `text-dummy-black/0` (invisible), visible only on CSS `group-hover`. Keyboard users who tab to it see nothing.
**Fix:** Use `focus-visible:opacity-100` alongside `group-hover:opacity-100`.
**Priority:** Medium | **Effort:** 5 min

### A11Y-2: No `aria-pressed` on pill selection buttons
**File:** `src/components/project/ProjectChoicesCard.tsx:63-76`
**What's wrong:** Selected state conveyed only via CSS class. Screen readers can't determine which pill is selected.
**Fix:** Add `aria-pressed={selected}` to pill buttons.
**Priority:** Medium | **Effort:** 10 min

### A11Y-3: Image error div missing `role="alert"`
**File:** `src/components/chat/ChatInput.tsx:163`
**What's wrong:** Error appears for 3 seconds then disappears. Screen readers never announce it.
**Fix:** Add `role="alert" aria-live="assertive"`.
**Priority:** Medium | **Effort:** 2 min

### A11Y-4: No `aria-expanded` on debug terminal expand buttons
**File:** `src/components/debug/DebugTerminal.tsx:71`
**What's wrong:** Expand/collapse state conveyed only by triangle character.
**Fix:** Add `aria-expanded={expanded}` to the button.
**Priority:** Low | **Effort:** 5 min

### A11Y-5: Setup checklist items have no `aria-live` region
**File:** `src/app/setup/page.tsx:172-233`
**What's wrong:** Step transitions from pending to checking to done are not announced.
**Fix:** Add `aria-live="polite"` to the checklist container.
**Priority:** Low | **Effort:** 5 min

### A11Y-6: Ship page deploy progress inaccessible to screen readers
**File:** `src/app/ship/page.tsx:222-228`
**What's wrong:** Spinner and checkmark icons have no `aria-label` or `sr-only` text.
**Fix:** Add `<span className="sr-only">{stepLabel}: {status}</span>`.
**Priority:** Low | **Effort:** 10 min

### A11Y-7: Buttons use `title` instead of `aria-label`
**Files:** `ChatInput.tsx:178-185, 202-210`, `DebugTerminal.tsx:155-181`
**What's wrong:** `title` is not reliably announced by screen readers.
**Fix:** Use `aria-label` instead of (or in addition to) `title`.
**Priority:** Low | **Effort:** 10 min

---

## 10. Low: CSS/Tailwind

### CSS-1: Inline `style={{ height: "40vh" }}` in DebugTerminal
**File:** `src/components/debug/DebugTerminal.tsx:129`
**What's wrong:** Inline style where Tailwind class `h-[40vh]` would work.
**Fix:** Replace with `className="h-[40vh]"`.
**Priority:** Low | **Effort:** 1 min

### CSS-2: Inline `style={{ paddingLeft: 80 }}` in build page header
**File:** `src/app/build/page.tsx:291`
**What's wrong:** Magic pixel value as inline style.
**Fix:** Replace with `className="ps-20"` (80px = 5rem = p-20 in Tailwind).
**Priority:** Low | **Effort:** 1 min

### CSS-3: `accept` attribute diverges from `ACCEPTED_TYPES` constant
**File:** `src/components/chat/ChatInput.tsx:196 vs 10`
**What's wrong:** `accept="image/png,image/jpeg,image/gif,image/webp"` is manually typed. If `ACCEPTED_TYPES` array changes, this must be manually updated.
**Fix:** `accept={ACCEPTED_TYPES.join(",")}`.
**Priority:** Low | **Effort:** 2 min

---

## Priority Summary

| Priority | Count | Categories |
|----------|-------|------------|
| **Critical** | 5 | Security (path traversal, arbitrary file access, missing URL validation) |
| **High** | 16 | Architecture (god functions/components), error handling, type safety |
| **Medium** | 20 | State management, repeated patterns, performance, some a11y |
| **Low** | 21 | Magic strings, minor a11y, CSS, minor performance |

### Recommended Attack Order

1. **Security fixes** (SEC-1 through SEC-5) — < 1 hour total, critical risk reduction
2. **Error handling** (ERR-1 through ERR-4) — 1 hour, prevents silent failures
3. **Extract `parseAgentEvent` and `setupIPC`** (ARCH-1, ARCH-2) — 4 hours, biggest maintainability win
4. **Add store selectors** (STATE-2) — 1.5 hours, prevents unnecessary re-renders across 3 pages
5. **Remove derived `phase` from store** (STATE-3) — 1 hour, eliminates drift risk
6. **Extract `useIPCData` hook** (DRY-1) — 1 hour, eliminates 3x code duplication
7. **Type the Claude stream events** (TYPE-1, TYPE-2, TYPE-3) — 3 hours, foundational type safety
8. **Everything else** — iterative cleanup
