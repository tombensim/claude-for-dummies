# Claude Code for Dummies

An agent skill that guides non-technical people through building and shipping things with Claude Code — step by step, from first conversation to live URL.

No coding experience required. No jargon. Just describe what you want.

## Install

```bash
npx skills add tombensim/claude-for-dummies
```

## How It Works

One skill (`cc4d`) with a progress-tracking state machine. Claude gets one step at a time — no skipping, no guessing.

| Phase | Steps | What happens |
|---|---|---|
| **0: Setup** | 1-3 | Environment check, orientation, gather idea with interactive questions |
| **1: Build** | 4-5 | Scaffold Next.js + agentation, build first version, first reaction |
| **2: The Feedback Loop** | 6-8 | Introduce agentation, feedback cycles, save progress |
| **3: Shipping** | 9-11 | Push to GitHub, deploy to Vercel, get a live URL |

11 steps. Each step has an action, a verification check, and a capture that saves learnings to CLAUDE.md. If you leave and come back, Claude picks up where you left off.

## Stack

- **GitHub** — where your project lives (via `gh` CLI)
- **Vercel** — where your project goes live (zero-config deploys)
- **Agentation** — how you give visual feedback (click on elements, annotate what to change)

## Philosophy

- You don't need to learn to code. You need to learn to describe what you want.
- Build first, understand later. Action before explanation.
- The iteration loop is the skill. Everything else is just the first and last step.
- Plain language is the interface. If you can describe it, Claude can build it.
