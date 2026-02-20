"use client";

import { motion } from "framer-motion";

interface FeedbackTransitionProps {
  locale: "he" | "en";
  onFeedback: (message: string) => void;
}

const suggestions = [
  { he: "נראה טוב, בוא נמשיך", en: "Looks good, let's continue" },
  { he: "שנה צבעים", en: "Change colors" },
  { he: "שנה טקסט", en: "Change text" },
  { he: "הוסף עוד חלק", en: "Add a section" },
];

export default function FeedbackTransition({
  locale,
  onFeedback,
}: FeedbackTransitionProps) {
  const heading =
    locale === "he"
      ? "נו, מה אתה אומר? 👀"
      : "So? What do you think? 👀";

  const subtitle =
    locale === "he"
      ? "תגיד מה מפריע, מה בסדר, מה חסר."
      : "Tell me what bugs you, what you like, what's missing.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t-2 border-dummy-black/10 bg-dummy-white px-4 py-4"
    >
      <p className="mb-1 text-center text-sm font-bold text-dummy-black">
        {heading}
      </p>
      <p className="mb-3 text-center text-xs text-dummy-black/60">
        {subtitle}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onFeedback(locale === "he" ? s.he : s.en)}
            className="rounded-xl border-2 border-dummy-black bg-dummy-yellow px-3 py-1.5 text-xs font-bold text-dummy-black transition-all hover:bg-dummy-black hover:text-dummy-yellow"
          >
            {locale === "he" ? s.he : s.en}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
