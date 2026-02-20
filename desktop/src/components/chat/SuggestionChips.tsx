"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Wrench, Palette } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface SuggestionChipsProps {
  onSelect: (prefill: string) => void;
  forceShow?: boolean;
}

export default function SuggestionChips({ onSelect, forceShow }: SuggestionChipsProps) {
  const t = useTranslations("Workspace");
  const chipsVisible = useAppStore((s) => s.chipsVisible);
  const visible = forceShow || chipsVisible;

  const chips = [
    { label: t("chipAddFeature"), prefill: t("prefillAddFeature"), icon: Plus },
    { label: t("chipFixSomething"), prefill: t("prefillFixSomething"), icon: Wrench },
    { label: t("chipChangeDesign"), prefill: t("prefillChangeDesign"), icon: Palette },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10, height: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-wrap gap-2 px-3 pb-2"
        >
          {chips.map((chip, i) => (
            <motion.button
              key={chip.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(chip.prefill)}
              className="flex items-center gap-1.5 rounded-full border-2 border-dummy-black/20 bg-dummy-white px-3 py-1.5 text-sm font-medium text-dummy-black transition-all hover:border-dummy-black hover:shadow-[2px_2px_0_0_#1A1A1A]"
            >
              <chip.icon className="size-3.5" />
              {chip.label}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
