"use client";

import { createElement, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Monitor, Smartphone, RefreshCw } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface LivePreviewProps {
  refreshTrigger?: number;
  onFeedback?: (feedback: string) => void;
}

function extractLocalPreviewPort(url: string): number | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") return null;
    const port = Number(parsed.port);
    return Number.isFinite(port) && port > 0 ? port : null;
  } catch {
    return null;
  }
}

async function isPreviewReachable(url: string): Promise<boolean> {
  const localPort = extractLocalPreviewPort(url);
  if (localPort == null) return true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    await fetch(url, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export default function LivePreview({ refreshTrigger, onFeedback }: LivePreviewProps) {
  const t = useTranslations("Build");
  const previewUrl = useAppStore((s) => s.previewUrl);
  const previewMode = useAppStore((s) => s.previewMode);
  const setPreviewMode = useAppStore((s) => s.setPreviewMode);
  const setPreviewUrl = useAppStore((s) => s.setPreviewUrl);
  const previewRef = useRef<(HTMLIFrameElement & { reload?: () => void }) | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isElectron = typeof window !== "undefined" && !!window.electronAPI;

  function reloadPreview() {
    const frame = previewRef.current;
    if (!frame) return;
    if (typeof frame.reload === "function") {
      frame.reload();
      return;
    }
    try {
      frame.contentWindow?.location.reload();
    } catch {
      // Ignore cross-origin reload edge-cases.
    }
  }

  // Auto-refresh when refreshTrigger changes
  useEffect(() => {
    if (!refreshTrigger || !previewRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      reloadPreview();
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [refreshTrigger]);

  // Listen for agentation feedback from the preview iframe
  useEffect(() => {
    if (!onFeedback) return;
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "agentation-feedback" && event.data.payload) {
        onFeedback!(String(event.data.payload));
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onFeedback]);

  // Clear stale preview panes when local dev server has stopped.
  useEffect(() => {
    if (!previewUrl) return;
    let cancelled = false;
    const check = async () => {
      const reachable = await isPreviewReachable(previewUrl);
      if (!cancelled && !reachable) {
        setPreviewUrl(null);
      }
    };
    void check();
    const interval = setInterval(() => void check(), 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [previewUrl, setPreviewUrl]);

  function handleRefresh() {
    reloadPreview();
  }

  const previewWidth = previewMode === "mobile" ? "max-w-[375px]" : "w-full";

  return (
    <div className="flex h-full flex-col bg-dummy-black/5">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b-2 border-dummy-black/10 bg-dummy-white px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPreviewMode("mobile")}
            className={`rounded-lg p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-dummy-black ${
              previewMode === "mobile"
                ? "bg-dummy-black text-dummy-yellow"
                : "text-dummy-black/40 hover:text-dummy-black"
            }`}
            aria-label={t("mobile")}
            aria-pressed={previewMode === "mobile"}
          >
            <Smartphone className="size-4" />
          </button>
          <button
            onClick={() => setPreviewMode("desktop")}
            className={`rounded-lg p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-dummy-black ${
              previewMode === "desktop"
                ? "bg-dummy-black text-dummy-yellow"
                : "text-dummy-black/40 hover:text-dummy-black"
            }`}
            aria-label={t("desktop")}
            aria-pressed={previewMode === "desktop"}
          >
            <Monitor className="size-4" />
          </button>
        </div>

        <button
          onClick={handleRefresh}
          className="rounded-lg p-1.5 text-dummy-black/40 transition-colors hover:text-dummy-black focus-visible:outline-2 focus-visible:outline-dummy-black"
          aria-label={t("refresh")}
        >
          <RefreshCw className="size-4" />
        </button>
      </div>

      {/* Preview area */}
      <div className="flex flex-1 items-start justify-center overflow-auto p-4">
        <div
          className={`${previewWidth} h-full overflow-hidden rounded-xl border-2 border-dummy-black/20 bg-dummy-white shadow-lg transition-all`}
        >
          {previewUrl ? (
            isElectron
              ? createElement("webview", {
                  ref: previewRef as unknown as React.Ref<Element>,
                  src: previewUrl,
                  className: "h-full w-full",
                  allowpopups: "false",
                })
              : (
                <iframe
                  ref={previewRef}
                  src={previewUrl}
                  className="h-full w-full"
                  title="Preview"
                />
              )
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div className="text-dummy-black/30">
                <Monitor className="mx-auto mb-3 size-16" />
                <p className="text-sm font-medium">
                  {t("startingPreview")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
