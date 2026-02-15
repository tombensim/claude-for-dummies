---
name: cc4d-03-shipping
description: You built something and want other people to see it. This skill helps you put it on the internet with a real URL you can share — using GitHub and Vercel.
metadata:
  author: Michaelliv
  version: "1.0"
  series: cc-for-dummies
---

# Shipping: Get Your Thing on the Internet

You are helping someone put their project live on the internet. They've built something with Claude Code and want to share it. They don't know what GitHub or Vercel are, and they don't need to deeply understand them — they just need a URL.

## How to Behave

- Make this feel magical, not technical
- Handle all the git/GitHub/Vercel details yourself — don't explain the plumbing
- Use simple analogies when they need to understand something
- The goal is: they send a link to a friend and it works

## The Simple Version

Tell the user:
- "Let's put this on the internet so anyone can see it. I'll handle the technical stuff — you'll end up with a link you can share."

Then do these steps:

### Step 1: Save It to GitHub

GitHub is where your project lives online — think of it as a backup that also lets the internet see your code.

1. Make sure they're logged into GitHub CLI: run `gh auth status`
   - If not logged in: "I need to connect you to GitHub. Run this command and follow the prompts: `gh auth login`"
   - Walk them through it simply: "Choose GitHub.com, HTTPS, and Login with a web browser"
2. Create the repo (if it doesn't exist): `gh repo create [project-name] --public --source=. --push`
3. If the repo already exists, just push the changes:
   - `git add -A && git commit -m "Update" && git push`
4. Tell them: "Your project is saved. Now let's make it live."

**Keep it simple:** Don't explain git, commits, branches, or repositories in detail. If they ask:
- "GitHub is like a cloud backup for your project. It also lets other tools (like the one that puts it on the internet) access your files."

### Step 2: Deploy to Vercel

Vercel turns your project into a live website with a URL.

1. Check if they have the Vercel CLI: `npx vercel --version`
   - If not, it will auto-install when they use it
2. Deploy: `npx vercel --yes`
   - First time: it will ask them to log in — walk them through it
   - It will ask about project settings — use defaults (press Enter)
3. For production deploy: `npx vercel --prod --yes`
4. The output will include a URL — that's their live site

Tell them: "Here's your URL: [url]. Send it to anyone — it works on phones too."

### Step 3: Celebrate

This is a big moment. They built something and it's on the internet.
- "You just shipped something to the internet. That URL works for anyone, anywhere."
- "Want to share it? Just copy that link and send it to whoever you want."

## Updating After Deploy

When they make changes and want to update their live site:

1. "I'll save your changes and update the live version."
2. Push to GitHub: `git add -A && git commit -m "Update" && git push`
3. If Vercel is connected to GitHub (recommended), it auto-deploys
4. If not: `npx vercel --prod --yes`
5. "Your site is updated. Same URL, new version."

Teach them: "Every time we make changes and save them, your live site updates automatically. You don't have to do anything special."

## Custom Domain (If They Ask)

Only bring this up if they ask about using their own domain name:
- "You can connect your own domain (like yourname.com) through Vercel's dashboard"
- "Go to vercel.com, find your project, go to Settings → Domains, and add your domain"
- "You'll need to update some settings with whoever you bought your domain from — I can walk you through it"

Don't proactively suggest this — it adds complexity.

## When Things Go Wrong

### "The deploy failed"
- Check the error, fix it, try again
- Don't show them build logs — just say "Something in the setup needs fixing, let me handle it"

### "The site doesn't look right online but it worked locally"
- Usually a path issue or missing file — fix and redeploy
- "Sometimes things behave slightly different online. Let me fix that."

### "I want to take it down"
- "I can make the site private or delete it from Vercel. Want me to do that?"
- `npx vercel rm [project-name]`

### "Can other people see my code?"
- "Right now your code is public on GitHub, which means anyone can see how it's made. I can make it private if you prefer."
- If they want it private: `gh repo edit --visibility private`

## Important

- Handle all git details silently — the user doesn't need to know about branches, commits, or merge conflicts
- Vercel is the default. Don't offer hosting alternatives unless the user specifically asks
- Keep environment variables, build settings, and framework detection behind the scenes unless something breaks that requires the user's input

## Update CLAUDE.md

After shipping, update `CLAUDE.md` with:
- **Live URL**: the Vercel deployment URL so you can reference it in future sessions
- **GitHub repo**: the repo name and URL
- **Deploy setup**: how deployment is configured (Vercel connected to GitHub, or manual deploys)
- **Domain**: custom domain if they set one up

## What's Next

After they've shipped, remind them the loop continues:

- "Your site is live! And here's the best part — whenever you want to change something, just tell me. We'll tweak it together and your live site updates automatically."
- "You now know the whole workflow: describe what you want, build it together, iterate until it's right, and ship it. That's it. You can build anything this way."
