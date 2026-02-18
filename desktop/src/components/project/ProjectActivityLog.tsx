"use client";

import { useTranslations } from "next-intl";
import { useAppStore, type ProjectMilestone } from "@/lib/store";
import CollapsibleSection from "./CollapsibleSection";

const typeIcons: Record<ProjectMilestone["type"], string> = {
  choice: "\u2728",
  build: "\u{1F528}",
  change: "\u270F\uFE0F",
  publish: "\u{1F680}",
  other: "\u{1F4AC}",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ProjectActivityLog() {
  const t = useTranslations("ProjectPanel");
  const milestones = useAppStore((s) => s.milestones);

  if (milestones.length === 0) return null;

  const sorted = [...milestones].reverse().slice(0, 20);

  return (
    <CollapsibleSection title={t("activityLog")}>
      <div className="space-y-1">
        {sorted.map((m) => (
          <div
            key={m.id}
            className="flex items-start gap-2 py-1 text-xs text-dummy-black/80"
          >
            <span className="shrink-0 text-sm leading-none">
              {typeIcons[m.type]}
            </span>
            <span className="flex-1 leading-snug">{m.label}</span>
            <span className="shrink-0 text-[10px] text-dummy-black/40">
              {formatTime(m.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
