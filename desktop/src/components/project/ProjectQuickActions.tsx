"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FolderOpen, ExternalLink, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function ProjectQuickActions() {
  const t = useTranslations("ProjectPanel");
  const router = useRouter();
  const projectDir = useAppStore((s) => s.projectDir);
  const liveUrl = useAppStore((s) => s.liveUrl);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const resetForNewProject = useAppStore((s) => s.resetForNewProject);
  const setProjectDrawerOpen = useAppStore((s) => s.setProjectDrawerOpen);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleOpenFolder() {
    if (projectDir) {
      window.electronAPI?.openProject?.(projectDir);
    }
  }

  function handleVisitSite() {
    if (liveUrl) {
      window.electronAPI?.openExternal?.(liveUrl);
    }
  }

  function handleNewProject() {
    if (isStreaming) {
      setShowConfirm(true);
      return;
    }
    startNewProject();
  }

  function startNewProject() {
    setProjectDrawerOpen(false);
    resetForNewProject();
    router.push("/welcome");
  }

  return (
    <div className="border-t-2 border-dummy-black/10 px-4 py-3">
      {showConfirm ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-dummy-black/70">
            {t("confirmNewProject")}
          </p>
          <div className="flex gap-2">
            <button
              onClick={startNewProject}
              className="flex-1 rounded-lg bg-dummy-black px-3 py-1.5 text-xs font-bold text-dummy-yellow transition-colors hover:bg-dummy-black-light"
            >
              {t("confirmYes")}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 rounded-lg border-2 border-dummy-black/20 px-3 py-1.5 text-xs font-bold text-dummy-black transition-colors hover:border-dummy-black"
            >
              {t("confirmCancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {projectDir && (
            <button
              onClick={handleOpenFolder}
              className="flex w-full items-center gap-2 rounded-lg border-2 border-dummy-black/10 px-3 py-2 text-xs font-bold text-dummy-black transition-colors hover:border-dummy-black hover:bg-dummy-yellow-bright/30"
            >
              <FolderOpen className="size-4 shrink-0" />
              {t("openFolder")}
            </button>
          )}
          {liveUrl && (
            <button
              onClick={handleVisitSite}
              className="flex w-full items-center gap-2 rounded-lg border-2 border-dummy-black/10 px-3 py-2 text-xs font-bold text-dummy-black transition-colors hover:border-dummy-black hover:bg-dummy-yellow-bright/30"
            >
              <ExternalLink className="size-4 shrink-0" />
              {t("visitSite")}
            </button>
          )}
          <button
            onClick={handleNewProject}
            className="flex w-full items-center gap-2 rounded-lg bg-dummy-black px-3 py-2 text-xs font-bold text-dummy-yellow transition-colors hover:bg-dummy-black-light"
          >
            <Plus className="size-4 shrink-0" />
            {t("newProject")}
          </button>
        </div>
      )}
    </div>
  );
}
