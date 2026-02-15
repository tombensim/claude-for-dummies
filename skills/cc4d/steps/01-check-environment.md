# Step 1: Check Environment

## ACTION

Run the environment check script:

```bash
bash scripts/01-check-environment.sh
```

Parse the output. For each item that is `false`:

| Field | Fix |
|---|---|
| `NODE_OK: false` | Install Node.js: `brew install node` (macOS) or guide through nodejs.org |
| `GH_AUTH: false` | Open `https://github.com/signup` in browser. Tell user: "Sign up for GitHub — it's where your project gets saved online. Use 'Sign in with Google' if you can." Wait for them to finish, then run `gh auth login`. |
| `VERCEL_AUTH: false` | Open `https://vercel.com/signup` in browser. Tell user: "Sign up for Vercel — it's what puts your project on the internet." Wait for them to finish, then run `npx vercel login`. |
| `AGENTATION_INSTALLED: false` | Run `npm install agentation` silently. Don't explain what it is yet. |

After fixing, re-run the script to confirm all fields are `true`.

## CHECK

Script output shows `STATUS: ready`

## CAPTURE

Save to CLAUDE.md:
- Platform (macOS/Linux)
- Which accounts were newly created vs already existed

## NEXT

Run: `bash scripts/progress.sh complete 1`
