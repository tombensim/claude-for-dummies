"use client";

import { motion } from "framer-motion";
import { Rocket } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface PlanApprovalCardProps {
  onApprove: () => void;
}

export default function PlanApprovalCard({ onApprove }: PlanApprovalCardProps) {
  const locale = useAppStore((s) => s.locale);
  const isStreaming = useAppStore((s) => s.isStreaming);

  const heading =
    locale === "he"
      ? "התוכנית מוכנה"
      : "Plan ready";

  const subtitle =
    locale === "he"
      ? "כשאתה מרוצה מהתוכנית, לחץ כדי להתחיל לבנות."
      : "When you're happy with the plan, hit the button to start building.";

  const buttonText =
    locale === "he" ? "!יאללה, נתחיל" : "Let's build!";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-3 rounded-xl border-2 border-dummy-black bg-dummy-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-1">
        <Rocket className="size-4 text-dummy-black" />
        <p className="text-sm font-bold text-dummy-black">{heading}</p>
      </div>
      <p className="mb-3 text-xs text-dummy-black/60">{subtitle}</p>
      <button
        onClick={onApprove}
        disabled={isStreaming}
        className="w-full rounded-xl border-2 border-dummy-black bg-dummy-yellow px-4 py-2 text-sm font-bold text-dummy-black transition-all hover:bg-dummy-black hover:text-dummy-yellow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonText}
      </button>
    </motion.div>
  );
}
