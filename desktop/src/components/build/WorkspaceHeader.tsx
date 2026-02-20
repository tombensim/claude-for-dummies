"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft, Rocket, Globe, HardDrive } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface WorkspaceHeaderProps {
  onBack: () => void;
  onDeploy: () => void;
}

export default function WorkspaceHeader({ onBack, onDeploy }: WorkspaceHeaderProps) {
  const t = useTranslations("Welcome");
  const tw = useTranslations("Workspace");
  const idea = useAppStore((s) => s.idea);
  const projectName = useAppStore((s) => s.projectName);
  const liveUrl = useAppStore((s) => s.liveUrl);
  const isStreaming = useAppStore((s) => s.isStreaming);

  const displayName = idea || projectName || "Project";
  const isLive = !!liveUrl;

  return (
    <div className="flex items-center justify-between px-4 py-1.5">
      {/* Left: back + project name */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="rounded-md p-1 text-dummy-black/60 transition-colors hover:bg-dummy-black/10 hover:text-dummy-black"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="max-w-[200px] truncate text-sm font-bold text-dummy-black">
          {displayName}
        </span>
      </div>

      {/* Center: status badge */}
      <div className="flex items-center gap-1.5">
        {isLive ? (
          <>
            <Globe className="size-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-600">{t("statusLive")}</span>
          </>
        ) : (
          <>
            <HardDrive className="size-3.5 text-amber-600" />
            <span className="text-xs font-bold text-amber-600">{t("statusLocal")}</span>
          </>
        )}
      </div>

      {/* Right: deploy button */}
      <button
        onClick={onDeploy}
        disabled={isStreaming}
        className="flex items-center gap-1.5 rounded-lg border-2 border-dummy-black bg-dummy-black px-3 py-1 text-xs font-bold text-dummy-yellow transition-all hover:bg-transparent hover:text-dummy-black disabled:opacity-40"
      >
        <Rocket className="size-3.5" />
        {tw("deploy")}
      </button>
    </div>
  );
}
