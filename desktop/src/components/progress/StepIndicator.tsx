"use client";

import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import { PHASES, TOTAL_STEPS } from "@/lib/progress-config";
import PhaseLabel from "./PhaseLabel";

export default function StepIndicator() {
  const t = useTranslations("Progress");
  const currentStep = useAppStore((s) => s.currentStep);
  const completedSteps = useAppStore((s) => s.completedSteps);

  const progress = (completedSteps.length / TOTAL_STEPS) * 100;

  return (
    <div className="flex items-center gap-4 px-4 py-2">
      {/* Phase labels */}
      <div className="flex items-center gap-2">
        {PHASES.map(({ phase, steps, key }) => {
          const isActive = steps.includes(currentStep);
          const isDone = steps.every((s) => completedSteps.includes(s));
          return (
            <PhaseLabel
              key={phase}
              label={t(key)}
              isActive={isActive}
              isDone={isDone}
            />
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="flex-1">
        <div className="h-2 rounded-full bg-dummy-yellow-deep/30">
          <div
            className="h-2 rounded-full bg-dummy-black transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
