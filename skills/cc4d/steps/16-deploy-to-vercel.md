# Step 16: Deploy to Vercel

## ACTION

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

Script shows `LIVE: true`

## CAPTURE

Save to CLAUDE.md:
- **Live URL**: the Vercel deployment URL
- **Deploy setup**: how deployment is configured

## NEXT

Run: `bash scripts/progress.sh complete 16`
