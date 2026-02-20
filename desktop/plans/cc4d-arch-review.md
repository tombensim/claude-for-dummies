# CC4D (Claude for Dummies) Architecture Review

Date: 2026-02-20  
Reviewer: Senior Architect

## Overall Grade: **D**

The codebase has a solid foundation (clear domain grouping, thoughtful Electron/Next split, test scaffolding), but there are several high-impact architectural defects: a compile-time missing component, locale state split across two systems, fragile SSE dedup logic, and a heavy single-page orchestration pattern in `/build`.

## Executive Summary

- The current structure is conceptually good, but implementation consistency is weak.
- The highest-risk issues are around build reliability, state coherence, and event-stream correctness.
- Accessibility and type safety are below production quality in key surfaces.
- A focused 1-2 sprint refactor could move this to a B/B+ quickly.

## Findings (Prioritized)

### P0 (Must Fix Immediately)

1. **Compile blocker from missing source file + ignore rule conflict**
- Evidence:
  - `src/app/build/page.tsx:20` imports `@/components/build/WorkspaceHeader`.
  - `src/components/build/WorkspaceHeader.tsx` is missing.
  - `.gitignore:11` has `build/`, which ignores paths like `src/components/build/*`.
- Impact: app cannot typecheck/build reliably from a clean checkout; future files under `components/build` can be silently untracked.

### P1 (High Priority)

2. **Locale architecture is split/inconsistent (Zustand vs next-intl)**
- Evidence:
  - `src/components/brand/LanguageToggle.tsx:10` changes Zustand locale only.
  - `src/app/layout.tsx:25` gets locale from next-intl request context.
  - `src/i18n/routing.ts:5` defaults to Hebrew.
- Impact: mixed-language UI and RTL/LTR inconsistencies; translation state is not single-source-of-truth.

3. **Setup flow marks prerequisites as complete even when missing**
- Evidence:
  - `src/app/setup/page.tsx:77-87` and `src/app/setup/page.tsx:91-107` set `action-needed` but still call `markDone`.
  - `src/app/setup/page.tsx:124` sets `runtimeReady=true` unconditionally.
- Impact: users can proceed into build flow with missing runtime dependencies, causing downstream failures.

4. **`/build` page is an orchestration monolith with broad reactive scope**
- Evidence:
  - `src/app/build/page.tsx:39-355` combines routing, SSE, persistence, milestones, preview polling, debug stream, and UI layout.
  - `src/app/build/page.tsx:41` uses `useAppStore()` (full-store subscription).
  - Multiple eslint-disabled effect deps (`src/app/build/page.tsx:73`, `src/app/build/page.tsx:83`, `src/app/build/page.tsx:92`, `src/app/build/page.tsx:134`).
- Impact: difficult to reason about, higher rerender cost, and higher regression risk.

5. **SSE dedup logic can duplicate/drop messages across mixed event types**
- Evidence:
  - `src/lib/agent-client.ts:521-523` resets `lastAssistantBlockCount` on non-assistant events.
  - `src/lib/agent-client.ts:199-241` returns on first new assistant block, so additional new blocks in same event are not emitted in that pass.
  - `src/lib/agent-client.ts:472-474` HTTP error path does not clear `currentActivity`.
- Impact: inconsistent chat transcript, potential duplicate assistant text, stale activity indicators.

6. **Project progress state can bleed across projects**
- Evidence:
  - `src/lib/store.ts:219-246` `loadProject` does not reset/load `currentStep`, `phase`, or `completedSteps`.
  - `src/lib/store.ts:252-267` persists progress globally.
  - `src/app/welcome/page.tsx:108-110` only sets step for projects with `sessionId`.
- Impact: wrong timeline/progress after switching projects.

### P2 (Important)

7. **Type safety gaps at renderer-main boundary and app internals**
- Evidence:
  - `src/app/welcome/page.tsx:14` uses `any` for translation function.
  - `src/types/electron-api.d.ts:38-64` uses `unknown[]` for chat/milestones instead of domain types.
  - `src/app/build/page.tsx:65` uses ad-hoc typed meta object from IPC.
  - Electron main/preload remain JS (`electron/preload.js`, `electron/ipc-handlers.js`) with no shared typed contract.
- Impact: runtime-only failures, weaker refactor safety.

8. **Direct `window.electronAPI` calls are scattered across many UI components**
- Evidence: examples include `src/app/build/page.tsx`, `src/app/welcome/page.tsx`, `src/components/project/*`, `src/components/chat/AssistantMessage.tsx`.
- Impact: duplicated error handling and retry behavior, tighter UI-to-IPC coupling.

9. **Code duplication and drift across similar concerns**
- Evidence:
  - Duplicate Claude binary discovery: `electron/find-claude.js` and `src/lib/find-claude.ts`.
  - Duplicate id-generation helpers: `src/lib/agent-client.ts:69`, `src/lib/milestone-extractor.ts:3`.
  - Repeated JSON persistence handler patterns in `electron/ipc-handlers.js`.
- Impact: maintenance overhead and drift risk.

10. **Performance hotspots**
- Evidence:
  - Full-store subscriptions: `src/app/build/page.tsx:41`, `src/app/welcome/page.tsx:53`, `src/app/ship/page.tsx:23`, `src/app/done/page.tsx:16`.
  - Sync file logging (`appendFileSync`) in hot path: `src/lib/logger.ts:69`, used by streaming route (`src/app/api/agent/route.ts:63`, `src/app/api/agent/route.ts:178`).
  - Unbounded debug event growth: `src/lib/debug-store.ts:42`.
  - Large base64 image retention in chat state: `src/components/chat/ChatInput.tsx:33-39`.
- Impact: UI sluggishness and memory pressure on long sessions.

11. **Accessibility gaps in core interactions**
- Evidence:
  - Hardcoded Hebrew and RTL in a reusable question component: `src/components/chat/QuestionCard.tsx:48`, `src/components/chat/QuestionCard.tsx:87`.
  - Icon-only controls missing `aria-label`: `src/components/preview/LivePreview.tsx:58`, `src/components/preview/LivePreview.tsx:69`, `src/components/preview/LivePreview.tsx:82`, `src/components/project/ProjectInspirations.tsx:70`, `src/components/project/ProjectInspirations.tsx:93`, `src/components/project/ProjectInspirations.tsx:99`, `src/components/project/ProjectEnvVars.tsx:112`.
  - Inputs without explicit labels: `src/components/chat/ChatInput.tsx:211`, `src/components/project/ProjectInspirations.tsx:110`, `src/components/project/ProjectEnvVars.tsx:79`, `src/components/project/ProjectEnvVars.tsx:88`.
  - Chat stream lacks ARIA live announcements: `src/components/chat/ChatHistory.tsx:34`.
- Impact: keyboard/screen-reader usability is below acceptable baseline.

12. **Test strategy has blind spots for architectural regressions**
- Evidence:
  - `__tests__/e2e/full-flow.spec.ts:24-26` checks `/build` with only `body` visibility (won’t catch broken view wiring).
  - `__tests__/unit/lib/agent-client.test.ts:74` and `__tests__/unit/lib/agent-client.test.ts:357` assert stale status strings vs current mappings.
- Impact: critical regressions can slip while tests appear green or become noisy/flaky.

## Area-by-Area Assessment

### Folder Structure
- Strengths:
  - Good top-level separation (`electron/`, `src/app`, `src/components`, `src/lib`, tests).
  - Domain-oriented component grouping (`chat`, `project`, `progress`, `preview`).
- Issues:
  - Ignore rules conflict with source layout (`.gitignore:11`).
  - Architectural doc drift from implementation details (e.g., outdated assumptions vs current flows).

### Component Architecture
- Strengths:
  - Reusable presentational components exist and are mostly small.
- Issues:
  - `BuildPage` mixes orchestration and rendering concerns.
  - Cross-cutting dependencies (IPC/store/router/SSE) are not isolated via hooks/services.

### State Management (`store.ts`)
- Strengths:
  - Zustand + persistence is pragmatic for Electron renderer.
- Issues:
  - Monolithic store; global persistence of project-dependent progress.
  - Dead/underused fields and inconsistent lifecycle behavior across project switches.

### `agent-client.ts` SSE Handling
- Strengths:
  - Good abstraction boundary and callback surface.
  - Session resume support and raw event tap are useful.
- Issues:
  - Fragile dedup algorithm with mixed event streams.
  - Side effects into global store from transport layer.

### Code Duplication
- Multiple duplicated helpers/patterns increase drift risk.

### TypeScript Types
- Strong in some UI modules; weak at IPC boundaries and with `unknown[]`/`any` escapes.

### Performance
- Main concerns: broad store subscriptions, sync logging in stream loop, unbounded debug data.

### Accessibility
- Several controls fail semantic labeling and localization consistency requirements.

## Prioritized Improvement Plan

1. **P0 Reliability Patch (same day)**
- Fix `.gitignore` to target only packaging output (`/build/`), not source subpaths.
- Add missing `src/components/build/WorkspaceHeader.tsx` or change import path.
- Add CI `tsc --noEmit` + `next build` gate.

2. **P1 State & Locale Coherence (1-2 days)**
- Consolidate locale source of truth (next-intl-driven).
- Make language toggle update next-intl locale, not only Zustand.
- Make project progress project-scoped (load/save per project) and reset cleanly on switch.

3. **P1 Build Flow Refactor (2-4 days)**
- Extract `/build` orchestration into hooks:
  - `useAgentSession`
  - `useProjectLifecycle`
  - `usePreviewLifecycle`
  - `useMilestones`
- Replace broad `useAppStore()` with selector-based subscriptions.

4. **P1 SSE Robustness (1-2 days)**
- Replace block-count dedup with per-turn/per-message ids from stream payload.
- Ensure all new content blocks are emitted deterministically.
- Clear activity on all terminal/error paths.

5. **P2 IPC Typing & Duplication Cleanup (2-3 days)**
- Create shared IPC contract types used by preload + renderer + main.
- Remove duplicated helpers (`findClaude`, id generation, JSON persistence boilerplate).

6. **P2 Accessibility Pass (1-2 days)**
- Add explicit labels/`aria-label`s, `aria-live` for chat stream.
- Remove hardcoded Hebrew/RTL from shared components.
- Add keyboard-focus styles to custom buttons.

7. **P2 Performance Hardening (1-2 days)**
- Cap debug event buffer.
- Move hot-path logging to async/batched writes.
- Avoid unnecessary base64 retention where possible.

## What Is Working Well

- Electron security posture is decent (`contextIsolation: true`, `nodeIntegration: false` in `electron/main.js:118-120`).
- SSE server/client architecture is a reasonable base.
- Domain grouping and test structure provide a good starting point for maintainability after refactor.

