# Step 3: Gather the Idea

## ACTION

Ask ONE question: "What do you want to build? A website, a tool, a simple app — anything."

If they have no idea, suggest: "How about a personal page? Tell me your name and what you do."

Once they answer, you MUST use the **AskUserQuestion tool** to gather more detail in one shot. Do NOT ask these questions via regular text messages — the desktop UI renders AskUserQuestion as interactive cards that let the user tap their answers. Ask up to 4 questions:

1. **Vibe** — "What style fits your project?"
   - Options: "Clean & minimal", "Warm & earthy", "Bold & colorful", "Dark & modern"

2. **Audience** — "Who is this for?"
   - Options: "Just for me", "Customers / clients", "Students / community", "Friends & family"

3. **Priority** — "What's the most important thing people should be able to do?"
   - Options: "Learn about me / my business", "Sign up or get in touch", "Browse things I offer", "Just look cool"

4. **Design reference** — "Do you have a website you'd like yours to look like?"
   - Options: "Yes, I have a link", "No, surprise me"

### If they provide a link

Use WebFetch to analyze the reference site. Extract:
- Layout structure (sections, ordering)
- Color palette and typography feel
- Key UI patterns (cards, grids, hero style, nav style)
- Tone of copy (formal, casual, playful, etc.)

Save these observations and use them to guide the build in Step 4.

### If "surprise me"

Before building, you must internally generate a detailed project specification — as if the user had written a thorough, expert-level prompt. See `references/spec-examples.md` for the level of detail expected.

Based on the project type, vibe, audience, and priority, expand their brief description into:
- **Sections**: what pages/sections the site should have, in what order
- **Content**: what each section contains (headings, copy tone, placeholder text approach)
- **Features**: interactive elements, forms, cards, maps, galleries — whatever fits the project type
- **Visual design**: color palette, typography pairing, spacing feel, image style
- **Details that delight**: small touches that make it feel polished (hover effects, gradients, icons, animations)

Do NOT show this spec to the user. Just use it to build a much better first version. The user judges by the result, not the plan.

## CHECK

User has described what they want AND answered the AskUserQuestion options (or typed custom answers).

## CAPTURE

Save to CLAUDE.md:
- **What they want to build**: their exact words
- **Who it's for**: audience from AskUserQuestion
- **Style/vibe**: their pick
- **Key priority**: what matters most
- **Design reference**: URL if provided, or "surprise me"
- **Their name**: if they shared it

## NEXT

Run: `bash scripts/progress.sh complete 3`
