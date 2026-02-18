"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Palette, Users, Target, Pencil, Check } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface ChoiceRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function ChoiceRow({ icon, label, value }: ChoiceRowProps) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="shrink-0 text-dummy-black/50">{icon}</span>
      <span className="shrink-0 text-xs font-bold text-dummy-black/60">
        {label}
      </span>
      <span className="truncate text-xs font-medium text-dummy-black">
        {value}
      </span>
    </div>
  );
}

const VIBE_KEYS = ["vibeClean", "vibeWarm", "vibeBold", "vibeDark"] as const;
const AUDIENCE_KEYS = [
  "audienceMe",
  "audienceCustomers",
  "audienceStudents",
  "audienceFriends",
] as const;
const PRIORITY_KEYS = [
  "priorityLearn",
  "prioritySignup",
  "priorityBrowse",
  "priorityCool",
] as const;

interface PillGroupProps {
  icon: React.ReactNode;
  label: string;
  keys: readonly string[];
  current: string | null;
  onPick: (val: string) => void;
  t: (key: string) => string;
}

function PillGroup({ icon, label, keys, current, onPick, t }: PillGroupProps) {
  return (
    <div className="py-1.5">
      <div className="mb-1 flex items-center gap-2">
        <span className="shrink-0 text-dummy-black/50">{icon}</span>
        <span className="text-xs font-bold text-dummy-black/60">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {keys.map((key) => {
          const val = t(key);
          const isSelected = current === val;
          return (
            <button
              key={key}
              onClick={() => onPick(val)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                isSelected
                  ? "bg-dummy-black text-dummy-yellow"
                  : "border border-dummy-black/20 bg-dummy-white text-dummy-black/70 hover:border-dummy-black hover:text-dummy-black"
              }`}
            >
              {val}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ProjectChoicesCard() {
  const t = useTranslations("ProjectPanel");
  const tw = useTranslations("Welcome");
  const vibe = useAppStore((s) => s.vibe);
  const audience = useAppStore((s) => s.audience);
  const priority = useAppStore((s) => s.priority);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const setVibe = useAppStore((s) => s.setVibe);
  const setAudience = useAppStore((s) => s.setAudience);
  const setPriority = useAppStore((s) => s.setPriority);

  const [isEditing, setIsEditing] = useState(false);

  const hasAnyChoice = vibe || audience || priority;

  function updateChoice(
    setter: (val: string) => void,
    field: string,
    val: string
  ) {
    setter(val);
    if (activeProjectId) {
      window.electronAPI?.updateProject?.(activeProjectId, {
        [field]: val,
      });
    }
  }

  if (!hasAnyChoice && !isEditing) return null;

  const rows: { icon: React.ReactNode; label: string; value: string | null }[] =
    [
      {
        icon: <Palette className="size-3.5" />,
        label: t("style"),
        value: vibe,
      },
      {
        icon: <Users className="size-3.5" />,
        label: t("audience"),
        value: audience,
      },
      {
        icon: <Target className="size-3.5" />,
        label: t("priority"),
        value: priority,
      },
    ];

  const visibleRows = rows.filter((r) => r.value);

  return (
    <div className="px-4 py-2">
      <div className="mb-1 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-dummy-black/50">
          {t("choices")}
        </h4>
        <button
          onClick={() => setIsEditing((e) => !e)}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold text-dummy-black/40 transition-colors hover:text-dummy-black"
        >
          {isEditing ? (
            <>
              <Check className="size-3" />
              {t("doneEditing")}
            </>
          ) : (
            <>
              <Pencil className="size-3" />
              {t("editChoices")}
            </>
          )}
        </button>
      </div>

      {isEditing ? (
        <div className="divide-y divide-dummy-black/5">
          <PillGroup
            icon={<Palette className="size-3.5" />}
            label={t("style")}
            keys={VIBE_KEYS}
            current={vibe}
            onPick={(v) => updateChoice(setVibe, "vibe", v)}
            t={tw}
          />
          <PillGroup
            icon={<Users className="size-3.5" />}
            label={t("audience")}
            keys={AUDIENCE_KEYS}
            current={audience}
            onPick={(v) => updateChoice(setAudience, "audience", v)}
            t={tw}
          />
          <PillGroup
            icon={<Target className="size-3.5" />}
            label={t("priority")}
            keys={PRIORITY_KEYS}
            current={priority}
            onPick={(v) => updateChoice(setPriority, "priority", v)}
            t={tw}
          />
        </div>
      ) : visibleRows.length > 0 ? (
        <div className="divide-y divide-dummy-black/5">
          {visibleRows.map((row) => (
            <ChoiceRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              value={row.value!}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
