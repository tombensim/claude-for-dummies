"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { PHASES } from "@/lib/progress-config";
import CollapsibleSection from "./CollapsibleSection";

const stepKeys = [
  "step1", "step2", "step3", "step4", "step5",
  "step6", "step7", "step8", "step9",
] as const;

export default function ProjectTimeline() {
  const t = useTranslations("ProjectPanel");
  const currentStep = useAppStore((s) => s.currentStep);
  const completedSteps = useAppStore((s) => s.completedSteps);

  return (
    <CollapsibleSection title={t("timeline")} defaultOpen>
      <div className="space-y-3">
        {PHASES.map(({ key, steps }) => (
          <div key={key}>
            <p className="mb-1 text-[11px] font-bold text-dummy-black/40">
              {t(key)}
            </p>
            <div className="space-y-0">
              {steps.map((step) => {
                const isCompleted = completedSteps.includes(step);
                const isCurrent = currentStep === step;
                return (
                  <div key={step} className="flex items-center gap-2.5 py-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex size-5 items-center justify-center rounded-full border-2 transition-all ${
                          isCompleted
                            ? "border-dummy-black bg-dummy-black text-dummy-yellow"
                            : isCurrent
                              ? "border-dummy-black bg-dummy-yellow ring-2 ring-dummy-black/20 ring-offset-1"
                              : "border-dummy-black/20 bg-dummy-white"
                        }`}
                      >
                        {isCompleted && <Check className="size-3" />}
                        {isCurrent && (
                          <div className="size-2 animate-pulse rounded-full bg-dummy-black" />
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs ${
                        isCompleted
                          ? "font-bold text-dummy-black"
                          : isCurrent
                            ? "font-bold text-dummy-black"
                            : "text-dummy-black/40"
                      }`}
                    >
                      {t(stepKeys[step - 1])}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
