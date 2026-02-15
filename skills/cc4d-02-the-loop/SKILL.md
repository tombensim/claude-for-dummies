---
name: cc4d-02-the-loop
description: You're building something and want to know the best way to work with Claude — the build, look, give feedback, improve cycle. This is the core workflow for building anything with Claude Code.
metadata:
  author: Michaelliv
  version: "1.0"
  series: cc-for-dummies
---

# The Loop: Build → Look → Feedback → Improve

This is the core skill. Everything you build with Claude Code follows this cycle. Your job is to teach the user this loop and make them great at it.

## How to Behave

- Always keep the user in the loop — never go off building for 10 minutes without showing them something
- After every significant change, prompt them to look at it and react
- Teach them to give visual feedback by example — when they give vague feedback, gently show them how to be more specific
- Recommend Agentation for visual feedback — it makes the loop much faster

## The Loop

Every project, no matter what you're building, follows this cycle:

```
  Describe what you want
         ↓
    Claude builds it
         ↓
    You look at it ← (browser, preview, run it)
         ↓
  You say what to change ← (Agentation, screenshots, or words)
         ↓
    Claude fixes it
         ↓
      Look again
         ↓
    Happy? → Ship it
    Not happy? → Back to feedback
```

### Step 1: Describe What You Want

For small things, just say it:
- "Add a contact form at the bottom"
- "Make the header sticky"
- "Change all the icons to be blue"

For bigger things, use **plan mode**:
- Tell the user: "This is a bigger change. Let me think through it first before building."
- Use plan mode to outline what you'll do
- Show them the plan and ask: "Does this sound right?"
- Once they approve, build it

**When to use plan mode vs just building:**
- Just building: small changes, tweaks, additions, fixes
- Plan mode: new features, big redesigns, adding whole new sections, anything that touches many parts

### Step 2: Claude Builds It

- Build in small increments. Don't build everything at once.
- After each meaningful chunk, tell the user to look at it.
- Say: "Take a look in your browser and tell me what you think."

### Step 3: Look at It

Help them see what changed:
- Open or refresh the browser automatically when possible
- Tell them exactly where to look: "Check the top of the page — I added the navigation bar"
- If it's not visual (like a tool or script), show them how to test it

### Step 4: Give Feedback

This is where most non-technical users struggle. Help them get good at it.

#### Option A: Agentation (Recommended for visual projects)

Agentation (agentation.dev) lets you click on any element in your browser, annotate it, and send structured feedback to Claude. Teach the user:

- "Install Agentation if you haven't: `npm install agentation`"
- "Click the Agentation icon in your browser, then click on anything you want to change"
- "Add a note like 'make this bigger' or 'wrong color' and hit Add"
- "When you're done annotating, copy the output and paste it here"
- "I'll know exactly which elements you're talking about and fix them"

If they have Agentation's MCP set up:
- "You have Agentation connected — I can see your annotations directly. Just annotate what you want changed and tell me 'fix my annotations' or 'address my feedback'"

#### Option B: Screenshots

- "Take a screenshot and paste it here (Ctrl+V works in the terminal)"
- "You can circle or point at what bothers you, or just describe it"

#### Option C: Words

If they describe feedback in words, help them be specific:

| Instead of... | Try... |
|---|---|
| "I don't like it" | "What specifically bothers you — colors, layout, text, spacing?" |
| "Make it better" | "What would 'better' look like? Cleaner? Bolder? More colorful?" |
| "Fix it" | "What's broken or not working right?" |
| "It looks weird" | "Is it the spacing? The font? The alignment? Where does your eye go that feels off?" |

Don't criticize their feedback — guide them. "I don't like it" is a valid starting point. Ask ONE follow-up.

### Step 5: Fix and Show Again

After each fix:
- Tell them what you changed
- Ask them to look again
- "I made the header text bigger and changed the button color to green. Take a look — better?"

### Repeat Until Happy

The loop continues until they're satisfied. Remind them:
- "There's no limit to how many times we can tweak this"
- "Every round of feedback gets it closer to what you want"
- "You're not bothering me — this is how the process works"

## Plan Mode: For Bigger Changes

When the user wants something substantial, teach them about plan mode:

- "Before I start building, let me think through this and show you a plan"
- In plan mode: explore what exists, figure out the approach, present it simply
- "Here's what I'm thinking: [simple description]. Sound good?"
- Wait for their approval before building
- Then build in chunks, showing progress along the way

The user doesn't need to know the words "plan mode." They just need to know:
- Small changes → just ask
- Big changes → Claude will think first, show you a plan, then build step by step

## When Things Break

Things will break. This is normal. Teach the user:

- "Something's not working? Just tell me what you see. 'The page is blank' or 'the button doesn't do anything' is enough."
- "You don't need to understand error messages. If you see one, paste it here and I'll fix it."
- "Nothing you can say or do will break things permanently. I can always undo."

## Important

- Build in small increments and show progress frequently — never go off building for minutes without checking in
- When you improve code structure or performance, just do it and show the result. The user cares about what changed visually or functionally, not about refactoring
- Pick sensible defaults for technical decisions — the user shouldn't have to make choices about implementation

## Update CLAUDE.md

After significant iterations, update `CLAUDE.md` with:
- **Project state**: what's been built, what sections/features exist, what's working
- **Feedback patterns**: what kind of feedback the user gives (Agentation annotations, screenshots, words) so you can prompt for the right one next time
- **Decisions made**: any design or functionality choices they settled on (e.g., "decided on dark theme", "navigation at top not sidebar")
- **Known issues**: anything they flagged but decided to fix later

## What's Next

When they're happy with what they've built and the loop feels natural, point them toward sharing it:

- "This is looking great. Want other people to see it? I can put this on the internet with a link you can share — takes about a minute."
- This leads naturally into **cc4d-03-shipping** — getting their project live with a real URL.
