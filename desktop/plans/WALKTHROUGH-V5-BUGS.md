# Walkthrough V5 Bugs — 2026-02-20

## ✅ Fixed
- **claudeAuthenticated**: Now correctly returns `true` from `/api/status` (checks `claude --version`)

## 🐛 Bugs Found

### 1. Setup page blocks in browser mode (non-Electron)
- **Severity**: High
- **Description**: `/setup` relies on `window.electronAPI?.getRuntimeStatus()` which doesn't exist in browser context. Steps 1 (tools) and 2 (Claude) show "action-needed" forever.
- **Workaround**: Navigate directly to `/welcome` to bypass setup.
- **Fix needed**: Setup page should fallback to `/api/status` endpoint when `window.electronAPI` is unavailable.

### 2. Preview iframe points to wrong port
- **Severity**: Critical
- **Description**: Preview iframe hardcoded to `http://localhost:3000/` but Claude Code started the dev server on port 3461. The preview shows a broken document icon.
- **Evidence**: `curl http://localhost:3461` was the actual dev server. iframe src = `http://localhost:3000/`.
- **Fix needed**: The app needs to detect the actual port the dev server started on and update the iframe src accordingly, OR instruct Claude to use port 3000 specifically.

### 3. Dev server dies after Claude process exits
- **Severity**: High  
- **Description**: Claude started `npm run dev` in a background process (PID 96963), but the process was killed when the Claude session ended. Preview becomes permanently broken.
- **Fix needed**: The dev server should be managed by the CC4D app directly, not spawned by Claude as a background process.

### 4. No question cards appeared
- **Severity**: Medium (UX gap)
- **Description**: Claude went straight to building without asking clarifying questions. Expected QuestionCards phase didn't trigger — Claude skipped directly from user prompt to "יאללה, מתחיל לבנות!" and started writing files.
- **Possible cause**: The system prompt may not be instructing Claude to ask questions first.

## 🟢 What Worked Well
- Welcome page renders beautifully with mascot and CTA
- Build page chat UI works — messages send, mascot responds
- Claude successfully created 28 files for a full Next.js art studio website
- File creation progress updates in real-time (file count increments)
- SoulNarrator appeared with "נו, מה אתה אומר? 👀" and action buttons
- Quick action pills (הוספת פיצ'ר, תיקון תקלה, שינוי עיצוב) appeared
- Mobile/desktop preview toggle works
- Phase bar (הכנה → בנייה → שיפור → השקה) is visible

## 📊 Build Stats
- 28 files created
- 37 Claude turns
- ~7 minutes build time
- $4.14 API cost
- Components: Hero, FeaturedWorks, WhyUs, Gallery (TechniqueFilter, ArtworkCard), Workshops (WorkshopCard), Registration (RegistrationForm), Contact (StudioInfo), Header, Footer, Layout
