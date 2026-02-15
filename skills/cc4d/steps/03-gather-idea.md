# Step 3: Gather the Idea

## ACTION

Ask ONE question: "What do you want to build? A website, a tool, a simple app — anything."

If they have no idea, suggest: "How about a personal page? Tell me your name and what you do."

Once they answer, use the **AskUserQuestion tool** to gather more detail in one shot. Ask up to 3 questions:

1. **Vibe** — "What style fits your project?"
   - Options: "Clean & minimal", "Warm & earthy", "Bold & colorful", "Dark & modern"

2. **Audience** — "Who is this for?"
   - Options: "Just for me", "Customers / clients", "Students / community", "Friends & family"

3. **Priority** — "What's the most important thing people should be able to do?"
   - Options: "Learn about me / my business", "Sign up or get in touch", "Browse things I offer", "Just look cool"

These replace the old multi-step description teaching. Get it all upfront, move on.

## CHECK

User has described what they want AND answered the AskUserQuestion options (or typed custom answers).

## CAPTURE

Save to CLAUDE.md:
- **What they want to build**: their exact words
- **Who it's for**: audience from AskUserQuestion
- **Style/vibe**: their pick
- **Key priority**: what matters most
- **Their name**: if they shared it

## NEXT

Run: `bash scripts/progress.sh complete 3`
