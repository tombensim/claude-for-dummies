# Step 10: Push to GitHub and Deploy

## ACTION

### Part 1: Push to GitHub

1. Check auth: `gh auth status`
   - If not authenticated: walk them through `gh auth login` — "Choose GitHub.com, HTTPS, and Login with a web browser"
2. Init git if needed: `git init && git add -A && git commit -m "Initial version"`
3. Create repo: `gh repo create [project-name] --public --source=. --push`
   - If repo already exists: `git add -A && git commit -m "Update" && git push`

Don't explain git. If they ask: "GitHub is like a cloud backup for your project."

### Part 2: Deploy to Vercel

1. Deploy: `npx vercel --prod --yes`
   - If login needed: walk them through it
2. Capture the URL from the output
3. Verify with:

```bash
bash scripts/02-verify-deploy.sh [URL]
```

If `LIVE: false`, diagnose and fix the issue, then redeploy.

Tell them: "Here's your URL: [url]. Send it to anyone — it works on phones too."

## CHECK

- Code is on GitHub (push succeeded)
- Script shows `LIVE: true`

## CAPTURE

Save to CLAUDE.md:
- **GitHub repo**: repo name and URL
- **Live URL**: the Vercel deployment URL
- **Deploy setup**: how deployment is configured

## NEXT

Run: `bash scripts/progress.sh complete 10`
