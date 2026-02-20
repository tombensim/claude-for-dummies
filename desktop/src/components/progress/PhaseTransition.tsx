"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PhaseTransitionProps {
  transition: { from: number; to: number } | null;
  locale: "he" | "en";
  onDismiss: () => void;
}

const transitionContent: Record<
  string,
  { he: string; en: string; emoji: string }
> = {
  "0→1": {
    he: "יאללה, בונים!",
    en: "Let's build!",
    emoji: "🏗️",
  },
  "1→2": {
    he: "יש גרסה ראשונה! עכשיו נשפר",
    en: "First version done! Let's polish",
    emoji: "🎨",
  },
  "2→3": {
    he: "נראה מעולה. מוכנים לעלות לאוויר?",
    en: "Looking great. Ready to go live?",
    emoji: "🚀",
  },
};

export default function PhaseTransition({
  transition,
  locale,
  onDismiss,
}: PhaseTransitionProps) {
  useEffect(() => {
    if (!transition) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [transition, onDismiss]);

  const key = transition ? `${transition.from}→${transition.to}` : null;
  const content = key ? transitionContent[key] : null;

  return (
    <AnimatePresence>
      {transition && content && (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          onClick={onDismiss}
          className="fixed inset-x-0 top-0 z-50 flex cursor-pointer items-center justify-center px-4 py-6"
        >
          <div className="rounded-2xl border-2 border-dummy-black bg-dummy-yellow px-8 py-5 shadow-lg">
            <p className="text-center text-2xl font-bold text-dummy-black">
              <span className="mr-2">{content.emoji}</span>
              {locale === "he" ? content.he : content.en}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
