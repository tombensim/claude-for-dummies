# Step 15: Push to GitHub

## ACTION

1. Check auth: `gh auth status`
   - If not authenticated: walk them through `gh auth login` — "Choose GitHub.com, HTTPS, and Login with a web browser"
2. Init git if needed: `git init && git add -A && git commit -m "Initial version"`
3. Create repo: `gh repo create [project-name] --public --source=. --push`
   - If repo already exists: `git add -A && git commit -m "Update" && git push`

Don't explain git. If they ask: "GitHub is like a cloud backup for your project."

## CHECK

Code is on GitHub (push succeeded).

## CAPTURE

Save to CLAUDE.md:
- **GitHub repo**: repo name and URL

## NEXT

Run: `bash scripts/progress.sh complete 15`
