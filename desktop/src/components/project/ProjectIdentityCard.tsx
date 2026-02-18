"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Pencil } from "lucide-react";
import MascotImage from "@/components/brand/MascotImage";
import { useAppStore } from "@/lib/store";

const phaseKeys = ["phase0", "phase1", "phase2", "phase3"] as const;

export default function ProjectIdentityCard() {
  const t = useTranslations("ProjectPanel");
  const idea = useAppStore((s) => s.idea);
  const phase = useAppStore((s) => s.phase);
  const liveUrl = useAppStore((s) => s.liveUrl);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const setIdea = useAppStore((s) => s.setIdea);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = idea || "New project";

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEditing() {
    setEditValue(idea || "");
    setIsEditing(true);
  }

  function saveName() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== idea) {
      setIdea(trimmed);
      if (activeProjectId) {
        window.electronAPI?.updateProject?.(activeProjectId, {
          displayName: trimmed,
        });
      }
    }
    setIsEditing(false);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <MascotImage
        pose="waving"
        alt=""
        width={48}
        height={48}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") cancelEdit();
            }}
            className="w-full rounded border-2 border-dummy-black/20 bg-dummy-white px-2 py-0.5 text-base font-bold text-dummy-black outline-none focus:border-dummy-black"
            aria-label={t("editName")}
          />
        ) : (
          <div className="group flex items-center gap-1.5">
            <h3 className="truncate text-base font-bold text-dummy-black">
              {displayName}
            </h3>
            <button
              onClick={startEditing}
              className="shrink-0 rounded p-0.5 text-dummy-black/0 transition-colors group-hover:text-dummy-black/40 hover:!text-dummy-black"
              aria-label={t("editName")}
            >
              <Pencil className="size-3" />
            </button>
          </div>
        )}
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-full bg-dummy-black/10 px-2.5 py-0.5 text-xs font-bold text-dummy-black">
            {t(phaseKeys[phase] ?? "phase0")}
          </span>
          {liveUrl && (
            <button
              onClick={() => window.electronAPI?.openExternal?.(liveUrl)}
              className="flex items-center gap-1 rounded-full bg-dummy-black px-2.5 py-0.5 text-xs font-bold text-dummy-yellow transition-colors hover:bg-dummy-black-light"
            >
              <ExternalLink className="size-3" />
              Live
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
