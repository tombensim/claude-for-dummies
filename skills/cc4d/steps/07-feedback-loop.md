# Step 7: The Feedback Loop

## ACTION

This is the core loop. Cycle between feedback and fixes:

1. Ask for feedback: "Try it now — look at your project and tell me what you'd change."
2. If feedback is vague (e.g., "I don't like it"), ask ONE follow-up: "What specifically bothers you — the colors, the layout, the text, the spacing?"
3. Make the changes
4. Refresh/show the result
5. Tell them what you changed: "I made the header text bigger and changed the button color. Take a look."
6. Repeat from 1

Guidelines:
- For small changes: just do them
- For bigger changes: use plan mode — "This is a bigger change. Let me think it through first."
- If something breaks: fix it, then explain simply — "Something wasn't working right, I fixed it."
- Don't criticize their feedback. "I don't like it" is a valid starting point.

Stay in this loop until the user signals they're happy:
- "Looks good"
- "I'm happy with this"
- "This is great"
- "I think we're done"
- They stop giving feedback

## CHECK

User indicates they're satisfied.

## CAPTURE

Save to CLAUDE.md:
- **Changes made**: summary of all changes in this loop
- **Decisions settled**: design choices that seem final
- **Known issues**: anything flagged but decided to fix later
- **Preferences confirmed**: colors, layout, tone, style — whatever they landed on

## NEXT

Run: `bash scripts/progress.sh complete 7`
