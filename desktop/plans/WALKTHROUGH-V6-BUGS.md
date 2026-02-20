# Walkthrough V6 — Bugs & Observations

**Date:** 2026-02-20
**Tester:** OpenClaw subagent

## Flow Summary

Welcome → Build (plan mode) → Type prompt → Claude responds → Plan ready → "יאללה נתחיל" → Build mode → Files being created → (browser tab lost, build killed)

## Bugs

### 🔴 BUG-1: Claude responds in English during plan mode
**Severity:** High
**Steps:** Send Hebrew prompt in plan mode
**Expected:** Claude asks questions in Hebrew (plan mode = ask questions before building)
**Actual:** Claude responded in English: "I'll continue building the bakery project. Let me read the plan and start implementing."
**Notes:** It seems like Claude resumed a previous session and skipped the questioning phase entirely. The `--permission-mode plan` flag was used but Claude still created files (witty-snuggling-parrot.md). The first response was in English despite `[IMPORTANT: Respond in Hebrew]` prefix.

### 🟡 BUG-2: Plan mode doesn't ask questions — skips to plan file
**Severity:** High
**Steps:** Send initial prompt in plan mode
**Expected:** Claude should ask clarifying questions (what kind of menu? what style? etc.) before creating a plan
**Actual:** Claude immediately created a plan file (witty-snuggling-parrot.md) without asking any questions. The plan mode phase was essentially a single-turn plan generation, not an interactive Q&A.
**Notes:** The system prompt or Claude CLI `--permission-mode plan` may not be correctly instructing Claude to ask questions first.

### 🟡 BUG-3: Tool use section content not visible
**Severity:** Medium
**Steps:** Click on collapsed "file 1" / "files N" section in chat
**Expected:** Should show file names/content being written
**Actual:** Section expands but content area appears empty (just yellow background)

### 🟢 BUG-4: Plan cost was $1.61 for a single plan
**Severity:** Info
**Notes:** The plan phase alone cost $1.61 with 9 turns and 180 seconds. This seems excessive for a planning step. May need to optimize the system prompt or limit plan mode iterations.

## What Worked ✅

1. **Welcome → Build navigation:** Smooth transition from welcome page CTA to build page
2. **Plan mode header:** Correctly shows "בוא נבין מה אתה צריך" with explanation
3. **"יאללה, נתחיל!" button:** Correctly appears after plan phase completes
4. **Build mode transition:** Successfully switches from plan to build mode with `--dangerously-skip-permissions`
5. **Build mode file creation:** Claude started creating files (Write, Bash, TodoWrite tools used)
6. **Session continuity:** Build mode correctly resumes the plan mode session ID
7. **Progress bar phases:** "הכנה בנייה שיפור השקה" steps visible at bottom

## Screenshots

All saved to `~/code/the-shift/claude-for-dummies/desktop/demo-video/screenshots-v6/`
- 01-setup-screen.jpg — Initial setup/loading screen
- 02-welcome.jpg — Welcome page with CTA
- 03-build-plan-mode.jpg — Build page in plan mode
- 04-typed-prompt.jpg — Hebrew prompt typed in input
- 05-claude-response-english.jpg — Claude's first (English) response
- 06-plan-with-approve-button.jpg — Plan ready with "יאללה, נתחיל!" button
- 07-plan-expanded.jpg — Expanded tool use section
- 08-build-mode-started.jpg — Build mode activated, Hebrew response
- 09-build-files-4.jpg — 4 files being created
- 10-fresh-build-page.jpg — Fresh page after tab reconnect

## Video

Not rendered — the build was interrupted when the browser tab was lost. Need a clean end-to-end run for video.
