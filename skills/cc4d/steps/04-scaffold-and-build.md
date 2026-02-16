# Step 4: Scaffold and Build

## ACTION

1. Scaffold a Next.js project. **Use `run_in_background: true`** — this command takes a while:

```
Bash(command: "npx create-next-app@latest [project-name] --ts --tailwind --app --no-eslint --no-src-dir --import-alias '@/*'", run_in_background: true)
```

Use the project name from what the user described (slugified, e.g., "pottery-class"). If the current directory already has files, scaffold into a subdirectory and tell the user. Wait for the background task to complete before continuing.

2. Install agentation. **Use `run_in_background: true`**:

```
Bash(command: "cd [project-name] && npm install agentation", run_in_background: true)
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

4. Build the first version based on everything gathered in Step 3 (vibe, audience, priority, design reference or generated spec). Use Tailwind CSS for styling. Build directly in `app/page.tsx`.

5. **Verify the build before showing it to the user.** Run a production build to catch any errors:

```
Bash(command: "cd [project-name] && npm run build", run_in_background: true)
```

If the build fails, read the error output, fix the code, and rebuild. Repeat until `npm run build` succeeds. Do NOT skip this step. Do NOT show the user a broken page. Common issues:
- Missing imports or typos
- Server/client component mismatches (missing `"use client"`)
- Invalid Tailwind classes
- JSX syntax errors

6. Once the build passes, start the dev server. **Use `run_in_background: true`**:

```
Bash(command: "cd [project-name] && npm run dev", run_in_background: true)
```

Then open `http://localhost:3000` in the browser. Do NOT use `&` to background the command. Do NOT set a timeout.

7. Tell them: "Take a look — I built a first version based on what you described."

Pick sensible defaults. Don't ask about technology choices. Use the vibe and priority from Step 3 to inform the design.

## CHECK

- Next.js project exists with `package.json`
- Agentation is in `node_modules`
- `app/agentation-wrapper.tsx` exists with `"use client"` directive
- **`npm run build` succeeded with no errors**
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
