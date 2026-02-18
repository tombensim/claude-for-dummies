"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Eye, EyeOff, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import CollapsibleSection from "./CollapsibleSection";

interface EnvVar {
  key: string;
  value: string;
}

export default function ProjectEnvVars() {
  const t = useTranslations("ProjectPanel");
  const projectDir = useAppStore((s) => s.projectDir);

  const [vars, setVars] = useState<EnvVar[]>([]);
  const [visibleValues, setVisibleValues] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!projectDir) return;
    window.electronAPI?.loadEnvVars?.(projectDir).then((loaded) => {
      if (Array.isArray(loaded)) setVars(loaded);
    });
  }, [projectDir]);

  function saveVars(next: EnvVar[]) {
    setVars(next);
    if (projectDir) {
      window.electronAPI?.saveEnvVars?.(projectDir, next);
    }
  }

  function updateVar(idx: number, field: "key" | "value", val: string) {
    const next = vars.map((v, i) =>
      i === idx ? { ...v, [field]: val } : v
    );
    setVars(next);
  }

  function handleBlur() {
    if (projectDir) {
      window.electronAPI?.saveEnvVars?.(projectDir, vars);
    }
  }

  function addVar() {
    setVars([...vars, { key: "", value: "" }]);
  }

  function removeVar(idx: number) {
    const next = vars.filter((_, i) => i !== idx);
    saveVars(next);
    setVisibleValues((prev) => {
      const updated = new Set<number>();
      prev.forEach((i) => {
        if (i < idx) updated.add(i);
        else if (i > idx) updated.add(i - 1);
      });
      return updated;
    });
  }

  function toggleVisibility(idx: number) {
    setVisibleValues((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <CollapsibleSection title={t("envVars")}>
      <div className="space-y-1.5">
        {vars.map((v, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              dir="ltr"
              value={v.key}
              onChange={(e) => updateVar(i, "key", e.target.value)}
              onBlur={handleBlur}
              placeholder={t("keyPlaceholder")}
              className="w-[35%] rounded border border-dummy-black/15 bg-dummy-white px-1.5 py-1 font-mono text-xs text-dummy-black outline-none placeholder:text-dummy-black/30 focus:border-dummy-black/40"
            />
            <div className="relative flex-1">
              <input
                dir="ltr"
                type={visibleValues.has(i) ? "text" : "password"}
                value={v.value}
                onChange={(e) => updateVar(i, "value", e.target.value)}
                onBlur={handleBlur}
                placeholder={t("valuePlaceholder")}
                className="w-full rounded border border-dummy-black/15 bg-dummy-white py-1 pe-7 ps-1.5 font-mono text-xs text-dummy-black outline-none placeholder:text-dummy-black/30 focus:border-dummy-black/40"
              />
              <button
                onClick={() => toggleVisibility(i)}
                className="absolute end-1 top-1/2 -translate-y-1/2 text-dummy-black/30 hover:text-dummy-black"
                aria-label={
                  visibleValues.has(i) ? t("hideValue") : t("showValue")
                }
              >
                {visibleValues.has(i) ? (
                  <EyeOff className="size-3" />
                ) : (
                  <Eye className="size-3" />
                )}
              </button>
            </div>
            <button
              onClick={() => removeVar(i)}
              className="shrink-0 rounded p-1 text-dummy-black/30 hover:text-red-500"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
        <button
          onClick={addVar}
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold text-dummy-black/50 transition-colors hover:text-dummy-black"
        >
          <Plus className="size-3" />
          {t("addVariable")}
        </button>
      </div>
    </CollapsibleSection>
  );
}
