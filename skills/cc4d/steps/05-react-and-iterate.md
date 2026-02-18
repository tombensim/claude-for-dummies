# Step 5: React and Iterate

## ACTION

Ask for feedback directly (see `references/voice.md`):

- EN: "So? What do you think? Tell me what bugs you, what you like, what's missing."
- HE: "נו, מה אתה אומר? תגיד מה מפריע, מה בסדר, מה חסר."

Then mention agentation briefly:
- "See the little icon in the bottom-right corner of your site? You can click it, click on anything you want to change, type a note, and paste it here. I'll know exactly what you're pointing at. You can also just describe changes in words — whatever's easiest."

Now loop between feedback and fixes:

1. User gives feedback (via agentation, screenshots, or words)
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

See `references/feedback-cheatsheet.md` for the full feedback guide.

## CHECK

User indicates they're satisfied.

## CAPTURE

Save to CLAUDE.md:
- **First reaction**: what they said initially
- **Feedback preference**: which method they use (Agentation, screenshots, words)
- **Changes made**: summary of all changes
- **Decisions settled**: design choices that seem final
- **Known issues**: anything flagged but decided to fix later
- **Preferences confirmed**: colors, layout, tone, style — whatever they landed on

## NEXT

Run: `bash scripts/progress.sh complete 5`
