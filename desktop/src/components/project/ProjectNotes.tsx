"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import CollapsibleSection from "./CollapsibleSection";

export default function ProjectNotes() {
  const t = useTranslations("ProjectPanel");
  const projectDir = useAppStore((s) => s.projectDir);

  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!projectDir) return;
    window.electronAPI?.loadNotes?.(projectDir).then((content) => {
      if (typeof content === "string") setText(content);
      setLoaded(true);
    });
  }, [projectDir]);

  function handleBlur() {
    if (projectDir && loaded) {
      window.electronAPI?.saveNotes?.(projectDir, text);
    }
  }

  return (
    <CollapsibleSection title={t("notes")}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder={t("notesPlaceholder")}
        className="min-h-[80px] w-full resize-none rounded-lg border border-dummy-black/15 bg-dummy-white px-3 py-2 text-xs text-dummy-black outline-none placeholder:text-dummy-black/30 focus:border-dummy-black/40"
      />
    </CollapsibleSection>
  );
}
