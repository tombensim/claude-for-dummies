import type { ChatMessage, ProjectMilestone } from "./store";

function uid(): string {
  return `ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Examine an incoming ChatMessage and extract a milestone if it represents
 * a noteworthy event (choice, build action, publish, etc.).
 * Returns null when the message isn't milestone-worthy.
 */
export function extractMilestone(
  msg: ChatMessage,
  locale: "he" | "en"
): ProjectMilestone | null {
  const now = msg.timestamp || Date.now();

  // Tool-based milestones
  if (msg.toolName) {
    const command = msg.toolInput?.command || "";

    // Scaffolding / creating project
    if (command.includes("create-next-app") || command.includes("npm init")) {
      return {
        id: uid(),
        type: "build",
        label: locale === "he" ? "הפרויקט נוצר" : "Project created",
        timestamp: now,
      };
    }

    // Dev server started
    if (command.includes("npm run dev") || command.includes("next dev")) {
      return {
        id: uid(),
        type: "build",
        label: locale === "he" ? "גרסה ראשונה מוכנה" : "First version built",
        timestamp: now,
      };
    }

    // Publishing
    if (command.includes("vercel") || command.includes("deploy")) {
      return {
        id: uid(),
        type: "publish",
        label: locale === "he" ? "האתר פורסם" : "Site published",
        timestamp: now,
      };
    }

    // File writes/edits — aggregate as "Made changes"
    if (msg.toolName === "Write" || msg.toolName === "Edit") {
      const fileName = msg.toolInput?.file_path?.split("/").pop() || "";
      return {
        id: uid(),
        type: "change",
        label:
          locale === "he"
            ? `עריכה: ${fileName}`
            : `Edited: ${fileName}`,
        timestamp: now,
      };
    }

    return null;
  }

  // Assistant text milestones — look for key phrases
  if (msg.role === "assistant" && msg.content) {
    const text = msg.content.toLowerCase();

    // Detect live URL announcement
    if (text.includes("vercel.app") || text.includes("your site is live")) {
      return {
        id: uid(),
        type: "publish",
        label: locale === "he" ? "האתר באוויר!" : "Site is live!",
        timestamp: now,
      };
    }

    return null;
  }

  return null;
}

/**
 * Throttle file-change milestones so we don't flood the log with
 * "Edited: foo.tsx" for every single file. Groups edits within a
 * 10-second window into a single "Made changes" entry.
 */
export function createMilestoneThrottler(locale: "he" | "en") {
  let lastFileChangeMilestone = 0;
  const FILE_CHANGE_COOLDOWN = 10_000; // 10 seconds

  return function maybeExtract(msg: ChatMessage): ProjectMilestone | null {
    const milestone = extractMilestone(msg, locale);
    if (!milestone) return null;

    // Throttle file changes
    if (milestone.type === "change") {
      const now = Date.now();
      if (now - lastFileChangeMilestone < FILE_CHANGE_COOLDOWN) {
        return null;
      }
      lastFileChangeMilestone = now;
      // Generalize throttled edits
      milestone.label = locale === "he" ? "בוצעו שינויים" : "Made changes";
    }

    return milestone;
  };
}
