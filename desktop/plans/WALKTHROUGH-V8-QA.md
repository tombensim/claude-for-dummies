# Walkthrough V8 - QA Report

Date: 2026-02-21
Project: claude-for-dummies desktop Electron app

## What works

- Setup page renders and transitions into welcome flow in Electron.
- Welcome page project creation path works and enters `/build`.
- Build chat accepts user input and streams assistant responses.
- Question card rendering works with multiple questions and option sets.
- Continue action on question cards is reachable and visible after selecting answers.
- Ship and Done pages render correctly and preserve expected UI state.

## What was broken

- Question cards could grow after selections without guaranteed bottom visibility, causing users to miss the final action area in tighter chat layouts.
- `QuestionCard` component test was stale (old single-click submit behavior) and no longer matched runtime behavior.
- Running `npm test` in `desktop/` could pick up `demo-video` dependency tests after Remotion installs.
- `LivePreview` tests were using outdated `title` selectors instead of current accessibility labels.

## What was fixed

- Added question-card-driven auto-scroll logic to keep the bottom action area visible when card height changes.
- Improved chat history bottom spacing and timing of auto-scroll to reduce clipping at lower viewport area.
- Updated `QuestionCard` test to validate the current multi-question + Continue flow.
- Updated `LivePreview` tests to use current ARIA labels.
- Updated Vitest config to exclude `demo-video/**` and nested `node_modules/**` so app tests stay scoped.
- Added a fresh `DemoV8` Remotion composition and rendered a new QA demo video from new screenshots.

## What remains

- In one live agent run, AskUserQuestion did not appear naturally despite prompt wording. The UI path is fixed and verified with seeded real chat-history data, but tool invocation consistency still depends on agent behavior.
- Next.js logs repeated non-blocking font fallback warnings for `Playpen Sans Hebrew` during dev.

## Artifacts

- Screenshots: `desktop/demo-video/screenshots-v8/`
- Video: `desktop/demo-video/out/qa-flow-v8.mp4`
