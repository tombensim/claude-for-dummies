"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const locale = useAppStore((s) => s.locale);

  // Use the playful handwritten font for Hebrew, display font for English
  const fontClass = locale === "he" ? "font-hand" : "font-display";

  return (
    <div className="px-4 py-2">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between py-1"
      >
        <h4 className={`text-sm tracking-wide text-dummy-black/60 ${fontClass}`}>
          {title}
        </h4>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-dummy-black/40"
        >
          <ChevronDown className="size-3.5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
