# The Loop — Reference

## Agentation Setup

Agentation (agentation.dev) is a tool that lets you click on elements in your browser and annotate them. Instead of trying to describe what's wrong in words, you point at it and type a note.

### Install
```
npm install agentation
```

### How to Use
1. Open your project in the browser
2. Click the Agentation icon (bottom-right corner)
3. Hover over elements — they'll highlight with their names
4. Click an element you want to change
5. Type your feedback (e.g., "make this bigger", "wrong color", "remove this")
6. Click "Add"
7. Repeat for everything you want to change
8. Click "Copy" to get formatted output
9. Paste into Claude Code

### MCP Integration (Skip Copy-Paste)
If you set up Agentation's MCP, Claude can see your annotations directly. Just annotate and say "address my feedback."

## Feedback Cheat Sheet

### Colors & Visual Style
- "Too dark / too light / too bright"
- "I want it to feel [warm / cool / professional / playful / clean / bold]"
- "Use colors like [brand / website you like]"
- "Make the background white / dark / [color]"

### Layout & Spacing
- "Too cramped / too spread out"
- "This should be at the [top / bottom / left / right]"
- "These things should be side by side / stacked"
- "More breathing room between these"
- "Center this"

### Text & Fonts
- "Too small / too big"
- "Hard to read"
- "Make the heading stand out more"
- "This text feels boring — make it [bolder / more interesting]"
- "Wrong tone — should sound more [professional / casual / friendly / serious]"

### Functionality
- "Nothing happens when I click this"
- "It should [do X] when I [do Y]"
- "This is confusing — I expected it to [behavior]"
- "This is too slow"
- "This works on my computer but not my phone"

### General Reactions
- "I love this part, don't change it"
- "This section feels off but I can't explain why"
- "Can you show me two different versions of this?"
- "Go back to how it was before"

## Plan Mode vs Just Asking

| Situation | Approach |
|---|---|
| "Change the button color" | Just ask |
| "Add a phone number field" | Just ask |
| "Redesign the whole homepage" | Plan mode |
| "Add a shopping cart" | Plan mode |
| "Fix the typo" | Just ask |
| "Build a new section for testimonials" | Could go either way — ask if unsure |
| "Make it work on mobile" | Plan mode |
| "I want to start over" | Plan mode |
