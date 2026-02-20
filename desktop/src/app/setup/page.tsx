"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import MascotImage from "@/components/brand/MascotImage";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

interface CheckItem {
  key: string;
  status: "pending" | "checking" | "done" | "action-needed";
}

export default function SetupPage() {
  const t = useTranslations("Setup");
  const router = useRouter();
  const setRuntimeReady = useAppStore((s) => s.setRuntimeReady);
  const setClaudeAuthenticated = useAppStore((s) => s.setClaudeAuthenticated);

  const [items, setItems] = useState<CheckItem[]>([
    { key: "gettingReady", status: "pending" },
    { key: "settingUpTools", status: "pending" },
    { key: "connectingClaude", status: "pending" },
    { key: "settingUpWorkspace", status: "pending" },
    { key: "almostThere", status: "pending" },
  ]);

  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function markChecking(index: number) {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, status: "checking" } : item
        )
      );
    }

    async function markDone(index: number) {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, status: "done" } : item
        )
      );
    }

    async function markActionNeeded(index: number) {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, status: "action-needed" } : item
        )
      );
    }

    async function runChecks() {
      // Step 0: Getting ready
      if (cancelled) return;
      markChecking(0);
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;
      markDone(0);

      // Step 1: Setting up tools — check Node.js and Git via IPC
      if (cancelled) return;
      markChecking(1);
      let runtimeStatus = { nodeReady: false, gitReady: false, claudeReady: false };
      try {
        runtimeStatus = await window.electronAPI?.getRuntimeStatus?.() || runtimeStatus;
      } catch {}
      if (cancelled) return;

      if (!runtimeStatus.nodeReady || !runtimeStatus.gitReady) {
        markActionNeeded(1);
        // Wait and re-check once
        await new Promise((r) => setTimeout(r, 3000));
        try {
          runtimeStatus = await window.electronAPI?.getRuntimeStatus?.() || runtimeStatus;
        } catch {}
      }
      if (cancelled) return;
      // Only mark done if tools are actually available
      if (runtimeStatus.nodeReady && runtimeStatus.gitReady) {
        markDone(1);
      } else {
        markActionNeeded(1);
      }

      // Step 2: Connecting Claude — check Claude binary
      if (cancelled) return;
      markChecking(2);
      if (!runtimeStatus.claudeReady) {
        markActionNeeded(2);
        // Poll for Claude installation
        for (let attempt = 0; attempt < 10; attempt++) {
          await new Promise((r) => setTimeout(r, 2000));
          if (cancelled) return;
          try {
            const recheck = await window.electronAPI?.getRuntimeStatus?.();
            if (recheck?.claudeReady) {
              runtimeStatus = recheck;
              break;
            }
          } catch {}
        }
      }
      if (cancelled) return;
      // Only mark done if Claude is actually available
      if (runtimeStatus.claudeReady) {
        markDone(2);
      } else {
        markActionNeeded(2);
      }

      // Step 3: Setting up workspace
      if (cancelled) return;
      markChecking(3);
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;
      markDone(3);

      // Step 4: Almost there
      if (cancelled) return;
      markChecking(4);
      await new Promise((r) => setTimeout(r, 300));
      if (cancelled) return;
      markDone(4);

      const allDepsReady = runtimeStatus.nodeReady && runtimeStatus.gitReady && runtimeStatus.claudeReady;
      if (!cancelled) {
        setRuntimeReady(allDepsReady);
        setClaudeAuthenticated(runtimeStatus.claudeReady);
        setAllDone(allDepsReady);
        if (allDepsReady) {
          setTimeout(() => {
            if (!cancelled) router.push("/welcome");
          }, 1200);
        }
      }
    }

    runChecks();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progress =
    (items.filter((i) => i.status === "done").length / items.length) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dummy-yellow p-8">
      {/* Mascot */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <MascotImage
          pose={allDone ? "celebrating" : "hero"}
          alt="Mascot"
          width={200}
          height={200}
          priority
        />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8 text-center font-[family-name:var(--font-display)] text-3xl text-dummy-black"
      >
        {allDone ? t("ready") : t("title")}
      </motion.h1>

      {/* Checklist */}
      <div className="card-brand w-full max-w-md space-y-4 p-6">
        <AnimatePresence mode="sync">
          {items.map((item, idx) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-3"
            >
              {/* Status icon */}
              <div className="flex size-8 shrink-0 items-center justify-center">
                {item.status === "done" ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex size-6 items-center justify-center rounded-full bg-dummy-black"
                  >
                    <Check className="size-4 text-dummy-yellow" />
                  </motion.div>
                ) : item.status === "checking" ? (
                  <Loader2 className="size-5 animate-spin text-dummy-black" />
                ) : item.status === "action-needed" ? (
                  <div className="size-3 rounded-full bg-dummy-red" />
                ) : (
                  <div className="size-3 rounded-full bg-dummy-black/20" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-base font-medium ${
                  item.status === "done"
                    ? "text-dummy-black"
                    : item.status === "checking"
                      ? "text-dummy-black font-bold"
                      : "text-dummy-black/40"
                }`}
              >
                {t(item.key)}
              </span>

              {/* Action button for missing dependencies */}
              {item.status === "action-needed" && item.key === "connectingClaude" && (
                <Button
                  variant="brand"
                  size="sm"
                  className="ms-auto"
                  onClick={() => window.electronAPI?.openExternal?.("https://docs.anthropic.com/en/docs/claude-code/overview")}
                >
                  {t("loginButton")}
                </Button>
              )}
              {item.status === "action-needed" && item.key === "settingUpTools" && (
                <Button
                  variant="brand"
                  size="sm"
                  className="ms-auto"
                  onClick={() => window.electronAPI?.openExternal?.("https://nodejs.org")}
                >
                  {t("loginButton")}
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="mt-6 w-full max-w-md">
        <div className="h-3 overflow-hidden rounded-full bg-dummy-black/10">
          <motion.div
            className="h-full rounded-full bg-dummy-black"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}
