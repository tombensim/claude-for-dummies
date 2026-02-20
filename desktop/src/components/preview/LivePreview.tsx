"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Monitor, Smartphone, RefreshCw } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface LivePreviewProps {
  refreshTrigger?: number;
  onFeedback?: (feedback: string) => void;
}

export default function LivePreview({ refreshTrigger, onFeedback }: LivePreviewProps) {
  const t = useTranslations("Build");
  const previewUrl = useAppStore((s) => s.previewUrl);
  const previewMode = useAppStore((s) => s.previewMode);
  const setPreviewMode = useAppStore((s) => s.setPreviewMode);
  const webviewRef = useRef<HTMLWebViewElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-refresh when refreshTrigger changes
  useEffect(() => {
    if (!refreshTrigger || !webviewRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      (webviewRef.current as unknown as { reload: () => void })?.reload?.();
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

  function handleRefresh() {
    if (webviewRef.current) {
      (webviewRef.current as unknown as { reload: () => void }).reload();
    }
  }

  const previewWidth = previewMode === "mobile" ? "max-w-[375px]" : "w-full";

  return (
    <div className="flex h-full flex-col bg-dummy-black/5">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b-2 border-dummy-black/10 bg-dummy-white px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPreviewMode("mobile")}
            className={`rounded-lg p-1.5 transition-colors ${
              previewMode === "mobile"
                ? "bg-dummy-black text-dummy-yellow"
                : "text-dummy-black/40 hover:text-dummy-black"
            }`}
            title={t("mobile")}
          >
            <Smartphone className="size-4" />
          </button>
          <button
            onClick={() => setPreviewMode("desktop")}
            className={`rounded-lg p-1.5 transition-colors ${
              previewMode === "desktop"
                ? "bg-dummy-black text-dummy-yellow"
                : "text-dummy-black/40 hover:text-dummy-black"
            }`}
            title={t("desktop")}
          >
            <Monitor className="size-4" />
          </button>
        </div>

        <button
          onClick={handleRefresh}
          className="rounded-lg p-1.5 text-dummy-black/40 transition-colors hover:text-dummy-black"
          title={t("refresh")}
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
            // In Electron, this would be a <webview> tag
            // In browser dev, we use an iframe
            <iframe
              ref={webviewRef as unknown as React.Ref<HTMLIFrameElement>}
              src={previewUrl}
              className="h-full w-full"
              title="Preview"
            />
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
