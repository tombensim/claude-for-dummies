# CC4D Flow Fix Plan

## Root Cause Analysis

### How step progression works today
1. Claude CLI runs `bash scripts/progress.sh complete N` during the conversation
2. `agent-client.ts` → `parseAgentEvent()` detects `progress.sh complete (\d+)` in Bash tool_use commands
3. `onStepCompleted` callback fires → calls `store.completeStep(step)` + `store.setStep(step+1, phase)`
4. `StepIndicator` reads `currentStep` / `completedSteps` from store and renders phase pills + progress bar

### Why each problem happens

**Problem 1: AskUserQuestion not visible**
- `parseAgentEvent()` correctly detects `AskUserQuestion` tool_use and creates a message with `questionData`
- `activity-blocks.ts` correctly creates a `"question"` block type
- `QuestionCard` renders the options as clickable buttons
- **BUT**: The QuestionCard only handles ONE question at a time. When the user clicks an option, `onAnswer(opt.label)` sends just that label as the full prompt. The skill expects ALL 4 questions answered in one AskUserQuestion call, but the UI sends each answer as a separate message, breaking the flow.
- **ALSO**: The skill says "use the AskUserQuestion tool to gather more detail in one shot" with up to 4 questions. But AskUserQuestion is a Claude Code MCP tool — it presents questions sequentially in the terminal. When wrapped in the desktop UI, the SSE stream shows ONE tool_use block with all questions. The QuestionCard renders all questions but each button sends only that one option's label, not a structured response.
- **LIKELY ROOT CAUSE**: Claude may not actually use AskUserQuestion at all — it may just ask questions via text (assistant messages), since `--dangerously-skip-permissions` mode changes tool behavior. The step says "use AskUserQuestion tool" but Claude may not have it available or may skip it.

**Problem 2: No visible phase transitions**
- `StepIndicator` updates phase pills reactively via store state
- But the transition is a quiet CSS change (background color swap) — no animation, no announcement, no celebration moment
- The `StepIndicator` is at the bottom of ChatPanel, easy to miss
- There's no "phase transition event" — it's just a number change in the store

**Problem 3: Missing Shaul voice layer**
- `voice.md` exists in the skill's references and tells Claude HOW to write
- But during Step 4 (build), the UI shows raw tool calls as `"status"` messages via `toolMessageMap` translations
- The actual assistant text messages DO come through with Shaul voice (since Claude follows voice.md)
- **BUT**: During heavy building, there are many status messages (creating files, running commands) and few assistant text messages. The voice gets drowned out by technical noise.
- There's no separate "narrator" layer that translates build activity into friendly commentary

**Problem 4: No feedback/improvement loop**
- `LivePreview` shows when `previewUrl` is set (detected via `onDevServerDetected` → port 3000 poll)
- The feedback banner shows after step 4 completes (`completedSteps.includes(4)`)
- **BUT**: The banner is a static text at the bottom of the page — not an interactive flow
- There's no transition moment that says "OK, building is done, now let's iterate"
- The agentation feedback tool (click-on-element) is mentioned in step 5 but not connected to the UI
- The preview appears during build (step 4) but there's no UX shift when entering step 5

---

## Implementation Plan

### Priority 1: Fix AskUserQuestion Flow (Problem 1)
**Complexity: Medium | Impact: Critical**

The gather-idea step is the foundation of the entire experience. Without it, users get a generic build.

#### 1a. Ensure Claude actually uses AskUserQuestion

**File: `skills/cc4d/steps/03-gather-idea.md`**
- Add explicit instruction: "You MUST use the AskUserQuestion tool. Do not ask these questions via regular text messages."
- Add the exact tool call format Claude should use

**File: `desktop/src/app/api/agent/route.ts`**  
- Verify that `--dangerously-skip-permissions` doesn't disable AskUserQuestion
- If it does, we need to find an alternative approach (see 1b)

#### 1b. Fix QuestionCard to collect ALL answers before sending

**File: `desktop/src/components/chat/QuestionCard.tsx`**

Current behavior: Each option button calls `onAnswer(opt.label)` immediately.

New behavior:
```tsx
// Track selected answers per question
const [selections, setSelections] = useState<Record<number, string>>({});

// Only send when all questions answered
function handleSelect(qIdx: number, label: string) {
  const updated = { ...selections, [qIdx]: label };
  setSelections(updated);
  
  if (Object.keys(updated).length === questions.length) {
    // Format all answers as a structured response
    const answer = questions
      .map((q, i) => `${q.question}: ${updated[i]}`)
      .join('\n');
    onAnswer(answer);
  }
}
```

- Add visual state: selected option gets filled/highlighted style
- Add a "Continue" button that appears when all questions are answered (alternative to auto-send)
- Show progress dots or checkmarks for answered questions

#### 1c. Fallback: Handle text-based questions

If Claude asks questions via text instead of AskUserQuestion, the UI should still create a guided experience.

**File: `desktop/src/lib/agent-client.ts`**

Add pattern detection in `parseAgentEvent()` for assistant text that contains numbered questions or option lists:
```typescript
// Detect question-like patterns in assistant text
if (blockType === "text") {
  const text = (block.text as string) || "";
  // Check if this looks like a multi-choice question
  if (looksLikeQuestionPrompt(text)) {
    return {
      message: {
        id: `question-${uid()}`,
        role: "assistant",
        content: text,
        timestamp: now,
        // Parse into questionData format for QuestionCard rendering
        questionData: parseTextQuestions(text),
      },
    };
  }
}
```

This is a fallback — Priority 1a (making Claude use the actual tool) is preferred.

---

### Priority 2: Add Phase Transition Moments (Problem 2)
**Complexity: Low-Medium | Impact: High**

#### 2a. Create PhaseTransition overlay component

**New file: `desktop/src/components/progress/PhaseTransition.tsx`**

A full-width animated banner that appears for ~3 seconds when the phase changes:

```tsx
interface PhaseTransitionProps {
  fromPhase: number;
  toPhase: number;
  locale: "he" | "en";
}
```

Content per transition:
| Transition | Hebrew | English |
|---|---|---|
| 0→1 (הכנה→בנייה) | "יאללה, בונים! 🏗️" | "Let's build! 🏗️" |
| 1→2 (בנייה→שיפור) | "יש גרסה ראשונה! עכשיו נשפר 🎨" | "First version done! Let's polish 🎨" |
| 2→3 (שיפור→השקה) | "נראה מעולה. מוכנים לעלות לאוויר? 🚀" | "Looking great. Ready to go live? 🚀" |

Visual: 
- Slides down from top or fades in as a centered card
- Mascot image changes pose per phase
- Background color shifts subtly
- Auto-dismisses after 3s or on click

#### 2b. Detect phase transitions in store

**File: `desktop/src/lib/store.ts`**

Add:
```typescript
// New state
phaseTransition: { from: number; to: number } | null;
setPhaseTransition: (transition: { from: number; to: number } | null) => void;
```

**File: `desktop/src/app/build/page.tsx`**

In the `onStepCompleted` callback:
```typescript
onStepCompleted: (step) => {
  const st = useAppStore.getState();
  const oldPhase = st.phase;
  st.completeStep(step);
  const newPhase = getPhaseForStep(step + 1);
  st.setStep(step + 1, newPhase);
  
  // Trigger phase transition if phase changed
  if (newPhase !== oldPhase) {
    st.setPhaseTransition({ from: oldPhase, to: newPhase });
    setTimeout(() => {
      useAppStore.getState().setPhaseTransition(null);
    }, 4000);
  }
}
```

#### 2c. Render PhaseTransition in build page

**File: `desktop/src/app/build/page.tsx`**

Add inside the main layout:
```tsx
<PhaseTransition
  transition={store.phaseTransition}
  locale={store.locale}
  onDismiss={() => store.setPhaseTransition(null)}
/>
```

#### 2d. Move StepIndicator to be more prominent

**File: `desktop/src/components/chat/ChatPanel.tsx`**

Move `<StepIndicator />` from bottom of ChatPanel to just below the header, so it's always visible. Or make it sticky at the bottom with more visual weight.

---

### Priority 3: Add Shaul Voice Narration Layer (Problem 3)
**Complexity: Medium | Impact: Medium-High**

#### 3a. Create a SoulNarrator component

**New file: `desktop/src/components/chat/SoulNarrator.tsx`**

A distinct UI element that shows Shaul-voice commentary during the build phase. Not a chat bubble — a "narrator bar" or aside.

```tsx
interface SoulNarratorProps {
  activity: string | null;
  phase: number;
  locale: "he" | "en";
}
```

This translates raw activities into warm, voice.md-style commentary:
- File creation → "מכין את הבמה..." / "Setting the stage..."
- npm install → "מביא את הכלים..." / "Grabbing the tools..."
- npm run build → "בודק שהכל במקום..." / "Making sure everything's in order..."
- npm run dev → "!הולך להיות טוב" / "Here we go!"

Visual: A small card above the chat input or overlaying the bottom of the chat, with the mascot avatar and a speech bubble. Different from status messages.

#### 3b. Enhance toolMessageMap with voice.md personality

**File: `desktop/src/lib/agent-client.ts`**

Replace the current `toolMessageMap` with richer, more Shaul-like translations:

```typescript
const toolMessageMap: Record<string, { en: string; he: string }> = {
  "npx create-next-app": {
    en: "Setting up your project... this is the fun part",
    he: "...מכין את הפרויקט שלך — עוד רגע יהיה פה משהו",
  },
  "npm run build": {
    en: "Checking everything works... fingers crossed",
    he: "...בודק שהכל עובד. אצבעות",
  },
  "npm run dev": {
    en: "Starting the preview... almost there",
    he: "...מפעיל תצוגה מקדימה. כמעט שם",
  },
  // ... etc with more personality
};
```

#### 3c. Collapse consecutive build status messages more aggressively

**File: `desktop/src/lib/activity-blocks.ts`**

Currently, all `status` messages merge into one `"building"` block. This is good. But the BuildingBlock component shows each individual status line when expanded.

Change: Show only the LAST status message in collapsed view (already done), and limit expanded view to last ~5 messages to reduce noise.

#### 3d. Add phase-aware narrator messages

**File: `desktop/src/app/build/page.tsx`** or new utility

When entering build phase (step 4 starts), inject a synthetic narrator message:
```typescript
if (step === 3) { // completing step 3, entering step 4
  st.addMessage({
    id: `narrator-${Date.now()}`,
    role: "status", // or new "narrator" role
    content: locale === "he" 
      ? "יאללה, אני מתחיל לבנות. תן לי כמה דקות — אני אראה לך כשיהיה מוכן."
      : "OK, I'm starting to build. Give me a few minutes — I'll show you when it's ready.",
    timestamp: Date.now(),
  });
}
```

---

### Priority 4: Connect Feedback/Iteration Loop (Problem 4)
**Complexity: Medium | Impact: High**

#### 4a. Create FeedbackTransition component

**New file: `desktop/src/components/chat/FeedbackTransition.tsx`**

When step 4 completes (build done), show a distinct UI moment:

```tsx
// Renders when completedSteps includes 4 and phase === 2
<FeedbackTransition locale={locale}>
  {/* HE: "נו, מה אתה אומר? 👀" */}
  {/* EN: "So? What do you think? 👀" */}
  {/* Shows the preview prominently */}
  {/* Has quick-action buttons: "Looks great!", "Change colors", "Change text", "Something else" */}
</FeedbackTransition>
```

#### 4b. Auto-expand preview when entering iteration phase

**File: `desktop/src/app/build/page.tsx`**

In `onStepCompleted`:
```typescript
if (step === 4) {
  // Force preview to be visible and prominent
  // Maybe switch to a 50/50 split or even preview-dominant layout
}
```

#### 4c. Add feedback suggestion chips

**File: `desktop/src/components/chat/SuggestionChips.tsx`** (extend existing)

When in step 5 (iterate), show contextual feedback chips:
- "שנה צבעים" / "Change colors"
- "שנה טקסט" / "Change text"  
- "הוסף עוד חלק" / "Add a section"
- "נראה מעולה!" / "Looks great!"

**File: `desktop/src/components/chat/ChatPanel.tsx`**

Show SuggestionChips not just in workspace mode but also during step 5:
```tsx
{(isWorkspaceMode || currentStep === 5) && <SuggestionChips onSelect={handleChipSelect} />}
```

#### 4d. Improve the feedback banner

**File: `desktop/src/app/build/page.tsx`**

Replace the static text banner with an interactive component:
```tsx
{!isWorkspace && store.completedSteps.includes(4) && !store.isStreaming && (
  <FeedbackBanner
    locale={store.locale}
    onFeedback={(type) => handleSend(type)}
    suggestions={[
      { he: "נראה טוב, בוא נמשיך", en: "Looks good, let's continue" },
      { he: "יש כמה דברים לשנות", en: "A few things to change" },
    ]}
  />
)}
```

#### 4e. Agentation integration note

The `agentation` npm package (installed in user projects) provides a click-to-feedback widget in the preview iframe. When the user clicks elements in the preview and writes feedback, that feedback needs to flow back to the chat.

**File: `desktop/src/components/preview/LivePreview.tsx`**

Add a `postMessage` listener for agentation events from the iframe:
```typescript
useEffect(() => {
  function handleMessage(event: MessageEvent) {
    if (event.data?.type === 'agentation-feedback') {
      // Inject feedback into chat input or send directly
      const feedback = event.data.payload;
      onFeedback?.(feedback);
    }
  }
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

This needs investigation — check how agentation actually communicates (postMessage, clipboard, etc.).

---

## Summary: Implementation Order

| # | Change | Files | Complexity | Impact |
|---|--------|-------|-----------|--------|
| 1 | Fix QuestionCard multi-answer flow | `QuestionCard.tsx` | Low | Critical |
| 2 | Ensure Claude uses AskUserQuestion | `03-gather-idea.md` | Low | Critical |
| 3 | Add PhaseTransition overlay | New `PhaseTransition.tsx`, `store.ts`, `build/page.tsx` | Medium | High |
| 4 | Move/enhance StepIndicator | `ChatPanel.tsx`, `StepIndicator.tsx` | Low | Medium |
| 5 | Enrich toolMessageMap with Shaul voice | `agent-client.ts` | Low | Medium |
| 6 | Add FeedbackTransition + chips at step 5 | New `FeedbackTransition.tsx`, `ChatPanel.tsx`, `build/page.tsx` | Medium | High |
| 7 | Add SoulNarrator component | New `SoulNarrator.tsx` | Medium | Medium |
| 8 | Connect agentation feedback to chat | `LivePreview.tsx` | Medium | Medium |
| 9 | Add text-question fallback parser | `agent-client.ts` | Medium | Low (fallback) |

**Estimated total effort: 2-3 days for a developer familiar with the codebase.**

Changes 1-2 should be done first and tested — they fix the most broken part of the flow. Changes 3+6 together create the "phase moment" experience. Changes 5+7 add the voice layer. Change 8 completes the feedback loop.
