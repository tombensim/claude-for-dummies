"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import MascotImage from "@/components/brand/MascotImage";
import { useAppStore } from "@/lib/store";

export default function PlanningHeader() {
  const t = useTranslations("Planning");
  const currentStep = useAppStore((s) => s.currentStep);
  const isPlanningPhase = currentStep <= 3;

  return (
    <AnimatePresence>
      {isPlanningPhase && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center px-4 pt-8 pb-4 text-center"
        >
          <MascotImage
            pose="waving"
            alt="Mascot"
            width={120}
            height={120}
            className="mb-4"
          />
          <h2 className="mb-1 font-[family-name:var(--font-display)] text-2xl text-dummy-black">
            {t("title")}
          </h2>
          <p className="text-sm text-dummy-black/60">
            {t("subtitle")}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
