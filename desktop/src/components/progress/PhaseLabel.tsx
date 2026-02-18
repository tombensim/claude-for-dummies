"use client";

import { Check } from "lucide-react";

interface PhaseLabelProps {
  label: string;
  isActive: boolean;
  isDone: boolean;
}

export default function PhaseLabel({ label, isActive, isDone }: PhaseLabelProps) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
        isDone
          ? "bg-dummy-black text-dummy-yellow"
          : isActive
            ? "bg-dummy-black/10 text-dummy-black ring-2 ring-dummy-black"
            : "bg-dummy-black/5 text-dummy-black/40"
      }`}
    >
      {isDone && <Check className="size-3" />}
      {label}
    </div>
  );
}
