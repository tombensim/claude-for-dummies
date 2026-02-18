"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Github, Triangle, Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import CollapsibleSection from "./CollapsibleSection";

interface AuthStatus {
  github: boolean;
  vercel: boolean;
  vercelUser: string | null;
}

export default function ProjectServices() {
  const t = useTranslations("ProjectPanel");
  const setProjectDrawerOpen = useAppStore((s) => s.setProjectDrawerOpen);
  const setPendingChatMessage = useAppStore((s) => s.setPendingChatMessage);

  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  function checkAuth() {
    if (loading) return;
    setLoading(true);
    window.electronAPI
      ?.checkAuthStatus?.()
      .then((result) => {
        setStatus(result);
        setHasChecked(true);
      })
      .catch(() => {
        setStatus({ github: false, vercel: false, vercelUser: null });
        setHasChecked(true);
      })
      .finally(() => setLoading(false));
  }

  function handleConnect(service: "github" | "vercel") {
    setProjectDrawerOpen(false);
    setPendingChatMessage(
      service === "github"
        ? t("connectGithubPrompt")
        : t("connectVercelPrompt")
    );
  }

  return (
    <CollapsibleSection title={t("services")}>
      {!hasChecked ? (
        <button
          onClick={checkAuth}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dummy-black/15 px-3 py-2 text-xs font-bold text-dummy-black/60 transition-colors hover:border-dummy-black hover:text-dummy-black"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              {t("checkingAuth")}
            </>
          ) : (
            t("checkingAuth").replace("...", "")
          )}
        </button>
      ) : (
        <div className="space-y-2">
          {/* GitHub */}
          <ServiceRow
            icon={<Github className="size-4" />}
            name={t("github")}
            connected={status?.github ?? false}
            connectedLabel={t("connected")}
            notConnectedLabel={t("notConnected")}
            connectLabel={t("connect")}
            onConnect={() => handleConnect("github")}
          />
          {/* Vercel */}
          <ServiceRow
            icon={<Triangle className="size-4" />}
            name={t("vercel")}
            connected={status?.vercel ?? false}
            connectedLabel={
              status?.vercelUser
                ? `${t("connected")} (${status.vercelUser})`
                : t("connected")
            }
            notConnectedLabel={t("notConnected")}
            connectLabel={t("connect")}
            onConnect={() => handleConnect("vercel")}
          />
        </div>
      )}
    </CollapsibleSection>
  );
}

interface ServiceRowProps {
  icon: React.ReactNode;
  name: string;
  connected: boolean;
  connectedLabel: string;
  notConnectedLabel: string;
  connectLabel: string;
  onConnect: () => void;
}

function ServiceRow({
  icon,
  name,
  connected,
  connectedLabel,
  notConnectedLabel,
  connectLabel,
  onConnect,
}: ServiceRowProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
      <span className="shrink-0 text-dummy-black/60">{icon}</span>
      <span className="text-xs font-bold text-dummy-black">{name}</span>
      <span
        className={`size-2 shrink-0 rounded-full ${
          connected ? "bg-green-500" : "bg-red-400"
        }`}
      />
      <span className="flex-1 text-xs text-dummy-black/60">
        {connected ? connectedLabel : notConnectedLabel}
      </span>
      {!connected && (
        <button
          onClick={onConnect}
          className="rounded bg-dummy-black px-2 py-0.5 text-[11px] font-bold text-dummy-yellow transition-colors hover:bg-dummy-black-light"
        >
          {connectLabel}
        </button>
      )}
    </div>
  );
}
