# Step 4: Scaffold and Build

## ACTION

1. Scaffold a Next.js project:

```bash
npx create-next-app@latest [project-name] --ts --tailwind --app --no-eslint --no-src-dir --import-alias "@/*"
```

Use the project name from what the user described (slugified, e.g., "pottery-class"). If the current directory already has files, scaffold into a subdirectory and tell the user.

2. Install agentation:

```bash
cd [project-name] && npm install agentation
```

3. Add agentation to the project. **Important**: Agentation is a client component and the root layout is a Server Component, so you must wrap it:

Create `app/agentation-wrapper.tsx`:
```tsx
"use client";

import { Agentation } from "agentation";

export default function AgentationWrapper() {
  return <Agentation />;
}
```

Then import and render `<AgentationWrapper />` inside the `<body>` tag in `app/layout.tsx`. Do NOT import `Agentation` directly in the layout — it will crash.

4. Build the first version based on everything gathered in Step 3 (vibe, audience, priority). Use Tailwind CSS for styling. Build directly in `app/page.tsx`.

5. Start the dev server and open in browser:

```bash
npm run dev &
```

Then open `http://localhost:3000` in the browser.

6. Tell them: "Take a look — I built a first version based on what you described."

Pick sensible defaults. Don't ask about technology choices. Use the vibe and priority from Step 3 to inform the design.

## CHECK

- Next.js project exists with `package.json`
- Agentation is in `node_modules`
- `app/agentation-wrapper.tsx` exists with `"use client"` directive
- Dev server is running
- Browser opened to localhost:3000

## CAPTURE

Save to CLAUDE.md:
- **Project directory**: path to the project
- **Files created**: list of files modified/created
- **Technology**: Next.js + Tailwind + agentation
- **Dev server**: running on localhost:3000

## NEXT

Run: `bash scripts/progress.sh complete 4`
