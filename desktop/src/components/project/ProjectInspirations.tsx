"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Star, ExternalLink, X, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import CollapsibleSection from "./CollapsibleSection";

export default function ProjectInspirations() {
  const t = useTranslations("ProjectPanel");
  const designRef = useAppStore((s) => s.designRef);
  const projectDir = useAppStore((s) => s.projectDir);

  const [urls, setUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectDir) return;
    window.electronAPI?.loadInspirations?.(projectDir).then((loaded) => {
      if (Array.isArray(loaded)) setUrls(loaded);
    });
  }, [projectDir]);

  function saveUrls(next: string[]) {
    setUrls(next);
    if (projectDir) {
      window.electronAPI?.saveInspirations?.(projectDir, next);
    }
  }

  function handleAdd() {
    const trimmed = newUrl.trim();
    if (!trimmed.startsWith("http")) {
      setError(t("invalidUrl"));
      return;
    }
    setError("");
    saveUrls([...urls, trimmed]);
    setNewUrl("");
  }

  function handleRemove(idx: number) {
    saveUrls(urls.filter((_, i) => i !== idx));
  }

  function truncateUrl(url: string) {
    try {
      const u = new URL(url);
      const display = u.hostname + u.pathname;
      return display.length > 35 ? display.slice(0, 35) + "..." : display;
    } catch {
      return url.length > 35 ? url.slice(0, 35) + "..." : url;
    }
  }

  return (
    <CollapsibleSection title={t("inspirations")}>
      <div className="space-y-1.5">
        {/* Main design reference from welcome flow */}
        {designRef && designRef !== "" && (
          <div className="flex items-center gap-2 rounded-md bg-dummy-yellow-bright/30 px-2 py-1.5">
            <Star className="size-3 shrink-0 text-dummy-black/50" />
            <span
              dir="ltr"
              className="flex-1 truncate text-xs font-medium text-dummy-black"
            >
              {truncateUrl(designRef)}
            </span>
            <button
              onClick={() =>
                window.electronAPI?.openExternal?.(designRef)
              }
              className="shrink-0 text-dummy-black/40 hover:text-dummy-black"
            >
              <ExternalLink className="size-3" />
            </button>
          </div>
        )}

        {/* Additional inspirations */}
        {urls.map((url, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-2 py-1"
          >
            <span
              dir="ltr"
              className="flex-1 truncate text-xs text-dummy-black/70"
            >
              {truncateUrl(url)}
            </span>
            <button
              onClick={() => window.electronAPI?.openExternal?.(url)}
              className="shrink-0 text-dummy-black/30 hover:text-dummy-black"
            >
              <ExternalLink className="size-3" />
            </button>
            <button
              onClick={() => handleRemove(i)}
              className="shrink-0 text-dummy-black/30 hover:text-red-500"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        {/* Add row */}
        <div className="flex items-center gap-1.5 pt-1">
          <input
            dir="ltr"
            value={newUrl}
            onChange={(e) => {
              setNewUrl(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            placeholder={t("urlPlaceholder")}
            className="flex-1 rounded border border-dummy-black/15 bg-dummy-white px-2 py-1 text-xs text-dummy-black outline-none placeholder:text-dummy-black/30 focus:border-dummy-black/40"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-0.5 rounded bg-dummy-black/10 px-2 py-1 text-[11px] font-bold text-dummy-black/60 transition-colors hover:bg-dummy-black hover:text-dummy-yellow"
          >
            <Plus className="size-3" />
            {t("addInspiration")}
          </button>
        </div>
        {error && (
          <p className="px-2 text-[11px] text-red-500">{error}</p>
        )}
      </div>
    </CollapsibleSection>
  );
}
