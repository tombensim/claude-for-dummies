"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { Rocket, Loader2, Check } from "lucide-react";
import MascotImage from "@/components/brand/MascotImage";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { connectToAgent } from "@/lib/agent-client";
import { getPhaseForStep } from "@/lib/progress-config";

type DeployStep =
  | "ready"
  | "saving"
  | "publishing"
  | "done";

export default function ShipPage() {
  const t = useTranslations("Ship");
  const router = useRouter();
  const store = useAppStore();
  const [deployStep, setDeployStep] = useState<DeployStep>("ready");
  const doneRef = useRef(false);
  const abortRef = useRef<{ abort: () => void } | null>(null);
  const mountedRef = useRef(true);

  // Abort agent stream on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  function handleShip() {
    setDeployStep("saving");

    const shipPrompt = store.locale === "he"
      ? "שלח את האתר שלי לאינטרנט!"
      : "Ship it! Put my site on the internet.";

    abortRef.current = connectToAgent({
      prompt: shipPrompt,
      locale: store.locale,
      projectDir: store.projectDir || undefined,
      sessionId: store.sessionId || undefined,
      onMessage: () => {},
      onSessionId: (sessionId) => {
        store.setSessionId(sessionId);
        const projectId = store.activeProjectId;
        if (projectId) {
          window.electronAPI?.updateProject?.(projectId, { sessionId }).catch(() => {});
        }
      },
      onDone: () => {
        if (!mountedRef.current) return;
        // If we haven't found a URL by the time the stream ends, move to done anyway
        if (!doneRef.current) {
          doneRef.current = true;
          setDeployStep("done");
          setTimeout(() => { if (mountedRef.current) router.push("/done"); }, 1500);
        }
      },
      onError: () => {
        if (!mountedRef.current) return;
        if (!doneRef.current) {
          doneRef.current = true;
          setDeployStep("done");
          setTimeout(() => { if (mountedRef.current) router.push("/done"); }, 1500);
        }
      },
      callbacks: {
        onStepCompleted: (step) => {
          store.completeStep(step);
          store.setStep(step + 1, getPhaseForStep(step + 1));
        },
        onLiveUrl: (url) => {
          store.setLiveUrl(url);
          store.setStep(9, 3);
          store.completeStep(8);

          const projectId = store.activeProjectId;
          if (projectId) {
            window.electronAPI?.updateProject?.(projectId, { liveUrl: url }).catch(() => {});
          }

          doneRef.current = true;
          if (mountedRef.current) {
            setDeployStep("done");
            setTimeout(() => { if (mountedRef.current) router.push("/done"); }, 1500);
          }
        },
        onDevServerDetected: () => {
          if (mountedRef.current) setDeployStep("publishing");
        },
      },
      onRawEvent: (raw) => {
        if (!mountedRef.current) return;
        // Drive the staged UI from real stream events
        const type = raw.type as string;
        if (type === "assistant") {
          const message = raw.message as Record<string, unknown> | undefined;
          const content = message?.content as Array<Record<string, unknown>> | undefined;
          if (!Array.isArray(content)) return;
          for (const block of content) {
            if (block.type === "tool_use" && block.name === "Bash") {
              const input = block.input as Record<string, unknown> | undefined;
              const command = (input?.command as string) || "";
              if (command.includes("git push") || command.includes("git commit")) {
                setDeployStep("saving");
              } else if (command.includes("vercel") || command.includes("deploy")) {
                setDeployStep("publishing");
              }
            }
          }
        }
      },
    });
  }

  function handleKeepWorking() {
    router.push("/build");
  }

  const deployMessages: Record<DeployStep, string> = {
    ready: "",
    saving: t("saving"),
    publishing: t("publishing"),
    done: t("yourSiteIsLive"),
  };

  return (
    <LazyMotion features={domAnimation}>
    <div className="flex min-h-screen flex-col items-center justify-center bg-dummy-yellow p-8">
      {/* Mascot */}
      <m.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8"
      >
        <MascotImage
          pose={deployStep === "done" ? "celebrating" : "magic"}
          alt="Mascot"
          width={200}
          height={200}
          className="rotate-2"
        />
      </m.div>

      <AnimatePresence mode="wait">
        {deployStep === "ready" ? (
          <m.div
            key="ready"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <h1 className="mb-8 font-[family-name:var(--font-display)] text-3xl text-dummy-black">
              {t("readyToShare")}
            </h1>

            <div className="flex flex-col gap-4">
              <Button
                variant="brand"
                size="xl"
                onClick={handleShip}
                className="gap-3"
              >
                <Rocket className="size-6" />
                {t("shipIt")}
              </Button>

              <Button
                variant="brand-outline"
                size="lg"
                onClick={handleKeepWorking}
              >
                {t("keepWorking")}
              </Button>
            </div>
          </m.div>
        ) : (
          <m.div
            key="deploying"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="card-brand space-y-4 p-6">
              {(
                ["saving", "publishing", "done"] as const
              ).map((step) => {
                const isActive = deployStep === step;
                const isDone =
                  ["saving", "publishing", "done"].indexOf(
                    deployStep
                  ) >
                  ["saving", "publishing", "done"].indexOf(step);

                if (
                  !isDone &&
                  !isActive &&
                  ["saving", "publishing", "done"].indexOf(step) >
                    ["saving", "publishing", "done"].indexOf(
                      deployStep
                    )
                ) {
                  return null;
                }

                return (
                  <m.div
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                  >
                    {isDone ? (
                      <div className="flex size-6 items-center justify-center rounded-full bg-dummy-black">
                        <Check className="size-4 text-dummy-yellow" />
                      </div>
                    ) : isActive ? (
                      <Loader2 className="size-5 animate-spin text-dummy-black" />
                    ) : null}
                    <span
                      className={`text-base font-medium ${
                        isDone
                          ? "text-dummy-black/60"
                          : "text-dummy-black font-bold"
                      }`}
                    >
                      {deployMessages[step]}
                    </span>
                  </m.div>
                );
              })}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
    </LazyMotion>
  );
}
