# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Delete Projects Feature

## Context
The welcome page lists projects but has no way to remove them. Users accumulate test projects and want to clean up. The `removeProject()` function already exists in `electron/project-store.mjs` but is never wired to IPC or exposed to the renderer.

## Changes

### 1. IPC handler — `project:delete`
**File:** `electron/ipc-handlers.js`

Add a new `project:delete` handler that:
- Looks up the project by id to get its `path`
- Ca...

### Prompt 2

the button is misplaced

### Prompt 3

I deleted a project, I still see it

### Prompt 4

commit this

