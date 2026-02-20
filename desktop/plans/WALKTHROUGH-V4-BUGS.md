# CC4D Walkthrough v4 — Bug Report
**Date:** 2026-02-20
**Branch:** main
**Tester:** Automated walkthrough via OpenClaw

## Summary
Walkthrough partially completed. The app progressed from Welcome → Build → AI Plan generation, but the build phase stalled because Claude CLI is not authenticated.

## Bugs Found

### BUG-1: Build stalls silently when Claude is not authenticated (P1)
**Steps:** Welcome → click CTA → type prompt → send → AI generates plan → then nothing happens
**Expected:** Clear error message or redirect to setup page indicating Claude needs authentication
**Actual:** The UI shows the plan response, phase bar moves to "בנייה", but no further progress. Status indicator "בודק קבצים..." appears briefly then disappears. No error shown to user.
**API confirms:** `GET /api/status` returns `{ claudeAuthenticated: false }`
**Impact:** User has no idea why nothing is happening. Silent failure.

### BUG-2: Setup page shows red dots but "התחברות" buttons may not work (P2 - needs verification)
**Steps:** Visit /setup
**Observed:** Red dots on "מגדירים כלים..." and "מתחברים לקלוד..." with "התחברות" buttons
**Note:** Could not verify if buttons actually open auth flow since this is an automated test. The mascot correctly shows a worried/thinking expression, which is a nice touch.

### BUG-3: Project name shows "New project" in project panel (P3 - cosmetic)
**Steps:** Send a prompt → open project panel
**Expected:** Project name should auto-derive from the prompt (e.g., "סטודיו לציור")
**Actual:** Shows "New project" in English

## What Worked Well ✅
1. **Welcome page** — Clean, inviting, mascot waving, clear CTA
2. **Build page** — Smooth transition, nice planning header with mascot
3. **Chat UX** — Message input, send button, image attach button all present
4. **Phase bar** — Shows 4 phases (הכנה, בנייה, שיפור, השקה) with correct progression
5. **AI plan response** — Nicely formatted with bullet points, tech stack, design spec
6. **File creation indicator** — Shows "יוצר witty-snuggling-parrot.md..." with file count
7. **Project panel** — Rich panel with timeline, connections, secrets, notes sections
8. **Timeline in panel** — Shows completed steps (בדיקת סביבה ✅, היכרות ✅, איסוף רעיונות ✅) and current step (בניית גרסה ראשונה 🔄)
9. **RTL layout** — Correct throughout
10. **Language toggle** — EN/HE button present in header

## Screenshots Captured
- `01-setup-page.jpg` — Initial setup/redirect page
- `02-welcome-page.jpg` — Welcome page with CTA
- `03-build-page-empty.jpg` — Build page before input
- `04-typed-prompt.jpg` — Input with Hebrew text
- `05-message-sent.jpg` — User message bubble
- `06-ai-plan-response.jpg` — AI plan with file indicators
- `07-project-panel.jpg` — Project panel with timeline
- `08-setup-not-connected.jpg` — Setup page showing auth issues

## Recommendation
The main blocker is BUG-1 — the app needs better error handling when Claude is not authenticated. Should either:
1. Show a toast/banner "Claude לא מחובר — לחץ כאן להתחברות"
2. Redirect to /setup when trying to build without auth
3. At minimum show the error state in the chat
