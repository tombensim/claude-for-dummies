# Shipping — Reference

## What GitHub and Vercel Do

Think of it this way:
- **GitHub** = where your project files are stored (like a cloud backup)
- **Vercel** = what turns those files into a live website with a URL

You don't need to understand how they work. You just need accounts on both.

## First-Time Setup Checklist

### GitHub
1. Create an account at github.com (if you don't have one)
2. In Claude Code, run: `gh auth login`
3. Choose: GitHub.com → HTTPS → Login with a web browser
4. Follow the browser prompts
5. Done — you won't need to do this again

### Vercel
1. Run `npx vercel` in Claude Code
2. It will ask you to log in — choose "Continue with GitHub" (easiest)
3. Follow the browser prompts
4. Done — you won't need to do this again

## Common Commands

| What you want | What to say to Claude |
|---|---|
| Put it on the internet | "Ship it" or "Deploy this" |
| Update the live site | "Push my changes" or "Update the live version" |
| Get the URL again | "What's my site URL?" |
| Take it offline | "Take down my site" |
| Make code private | "Make my repo private" |
| Use my own domain | "I want to use my own domain name" |

## How Auto-Deploy Works

Once GitHub and Vercel are connected:
1. You make changes with Claude
2. Claude saves them to GitHub
3. Vercel sees the changes automatically
4. Your live site updates in about 30 seconds
5. Same URL, new content

You don't need to do anything — it just happens.
