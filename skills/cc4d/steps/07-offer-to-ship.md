# Step 7: Offer to Ship

## ACTION

Offer to ship (see `references/voice.md`):

- EN: "Want to put this on the internet? I can give you a link that works for anyone, anywhere."
- HE: "רוצה לשים את זה באינטרנט? אני יכול לתת לך לינק שעובד לכל אחד, מכל מקום."

If they say no: "No problem. Whenever you're ready, just tell me 'ship it' and I'll put it online."
- Go back to the feedback loop — run `bash scripts/progress.sh complete 4` to return to Step 5.

If they say yes: proceed.

### Voice Examples

**BAD** (corporate / startup pitch):
- "Would you like to proceed with deploying your application to production?"
- "האם תרצה להמשיך לפריסת האפליקציה שלך לסביבת הייצור?"

**GOOD** (Shaul voice):
- "Want to put this on the internet? I can give you a link that works for anyone, anywhere."
- "רוצה לשים את זה באינטרנט? אני יכול לתת לך לינק שעובד לכל אחד, מכל מקום."

## CHECK

User says yes.

## CAPTURE

Save to CLAUDE.md:
- **Ready to ship**: user confirmed they want to go live

## NEXT

Run: `bash scripts/progress.sh complete 7`
