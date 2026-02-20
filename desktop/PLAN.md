# CC4D Desktop App — Action Plan

_Generated: 2026-02-20 | Status: Post-QA audit_

## Current State

The app is a **Next.js + Electron** desktop app that lets non-technical Hebrew speakers build websites with Claude AI. The core flow (Setup → Welcome → Plan → Build → Ship → Done) is implemented and has worked end-to-end (evidence: bakery project in session logs with file creation, npm install, dev server).

**What works:**
- All 6 pages render correctly
- Claude backend spawns and streams responses
- Session resumption works
- Project persistence via electron-store
- Milestone tracking and activity log
- Plan mode → Build mode transition
- Live preview with iframe
- Workspace mode for returning to projects
- Hebrew/English locale toggle
- Mascot images (all poses exist in `/public/mascot/`)

---

## Bugs & Issues

### 🔴 P0 — Critical (blocks demo/usage)

#### 1. ~~AskUserQuestion MCP tool blocked in Plan Mode~~ ✅ FIXED
- **File:** `src/app/api/agent/route.ts`
- **Fix applied:** Removed `--permission-mode plan`, both modes now use `--dangerously-skip-permissions`

#### 2. Chat messages not persisting in browser dev mode
- **Files:** `src/lib/use-chat-persistence.ts`, `src/app/build/page.tsx`
- **Issue:** In browser (no Electron), `useChatPersistence` calls `loadMessages([])` on mount which is correct for initial load. But if `setActiveProject` is called (which resets `messages: []`), then the persistence hook re-runs and loads empty again. Messages added via `addMessage` DO work during a session — the issue is only on project/page transitions.
- **Impact:** In Electron this likely works fine (loads from disk). In browser dev mode, messages survive within a session but not across navigations.
- **Action:** Add `localStorage` fallback in `useChatPersistence` when `electronAPI` is unavailable. This fixes browser dev testing AND provides a safety net.

#### 3. Initial agent message sent before project dir exists (browser mode)
- **File:** `src/app/build/page.tsx` line ~118
- **Issue:** In browser mode (no Electron), the code proceeds without `projectDir`. Claude then can't create files anywhere meaningful.
- **Impact:** Demo works for chat, but file creation goes to CWD of the Next.js server.
- **Action:** In browser dev mode, create a temp project dir under `~/Documents/Claude Projects/dev-{timestamp}` via API route, or show a picker.

### 🟡 P1 — Medium (degrades UX but not blocking)

#### 4. RTL text clipping in chat messages
- **Files:** `src/components/chat/ChatHistory.tsx`, `src/components/chat/ChatBubble.tsx`
- **Issue:** Hebrew text gets clipped on the right edge. Padding/margin doesn't account for RTL dir.
- **Action:** Add `dir="rtl"` to chat container, increase `pe-4` padding on message cards, check `overflow-hidden` vs `overflow-x-auto`.

#### 5. RTL text overflow in chat input
- **File:** `src/components/chat/ChatInput.tsx`
- **Issue:** Long Hebrew text in input field gets cut off on the right side.
- **Action:** Add `dir="rtl"` and `text-align: right` to the textarea.

#### 6. Setup page stuck without Electron API
- **File:** `src/app/setup/page.tsx`
- **Issue:** Steps 2 (tools) and 3 (Claude) check `window.electronAPI.checkTools()` and `checkClaudeAuth()`. Without Electron, these never resolve.
- **Impact:** Browser testing can't get past setup.
- **Action:** Add browser dev bypass: if no `electronAPI`, auto-complete steps 2+3 after a short delay with a "dev mode" indicator.

#### 7. Favicon missing
- **Issue:** 404 for `/favicon.ico`
- **Action:** Add favicon to `public/` or `src/app/`.

### 🟢 P2 — Low (polish)

#### 8. SoulNarrator timing
- **File:** `src/components/chat/SoulNarrator.tsx`
- **Issue:** Narrator can flash briefly when steps advance quickly during streaming.
- **Action:** Add minimum display time check (already partially implemented with 3s timer, verify it works).

#### 9. WebSocket HMR errors in dev
- **Issue:** Continuous `ERR_INVALID_HTTP_RESPONSE` for webpack HMR WebSocket.
- **Action:** Dev-only noise, but can add `electron-hmr-fix.js` error suppression. Low priority.

#### 10. Old plan files to clean up
- Various old/temp plan files in the repo from previous iterations.
- **Action:** Remove stale planning docs, keep only this PLAN.md.

---

## Action Items (Priority Order)

| # | Priority | Task | Effort |
|---|----------|------|--------|
| 1 | P0 ✅ | ~~Fix AskUserQuestion permission~~ | Done |
| 2 | P0 | Add localStorage fallback to chat persistence | 30 min |
| 3 | P1 | Fix RTL text clipping in chat bubbles | 30 min |
| 4 | P1 | Fix RTL text overflow in chat input | 15 min |
| 5 | P1 | Add browser dev bypass for setup page | 45 min |
| 6 | P0 | Ensure projectDir exists in browser mode | 30 min |
| 7 | P2 | Add favicon | 5 min |
| 8 | P2 | Clean up old plan files | 10 min |

**Total estimated effort: ~2.5 hours**

---

## Testing Plan

After fixes:
1. **Electron QA** — Run `npm run dev:electron`, walk through full flow (Setup → Welcome → Plan → Build → Ship → Done)
2. **Browser QA** — Run `npm run dev`, test same flow with browser dev bypasses
3. **Session resume** — Close and reopen app, verify conversation restores
4. **Workspace mode** — Return to existing project, verify context loads
5. **Hebrew RTL** — Verify all text renders correctly in both chat and forms

---

## Next Steps After Bug Fixes

1. **Video** — Take fresh Electron screenshots for v7 demo video
2. **Package** — Build Electron binary for macOS (`.dmg`)
3. **README** — Update with installation and usage instructions
4. **Ship to beta testers** — Hand to 2-3 non-technical users for feedback
