"use client";

import { motion, AnimatePresence } from "framer-motion";
import MascotImage from "@/components/brand/MascotImage";

/** Phase-aware narrator messages in Shaul's voice */
const narratorMessages: Record<
  number,
  { en: string; he: string; pose: string }
> = {
  // Phase 0: Setup (steps 1-2)
  1: {
    en: "Give me a sec to check everything's ready...",
    he: "שנייה, בודק שהכל מוכן...",
    pose: "peeking",
  },
  2: {
    en: "Hey! Let's figure out what you need.",
    he: "היי! בוא נבין מה אתה צריך.",
    pose: "waving",
  },
  // Phase 1: Build (steps 3-4)
  3: {
    en: "Tell me what you're picturing. I'll build it.",
    he: "ספר לי מה אתה רואה בראש. אני אבנה את זה.",
    pose: "waving",
  },
  4: {
    en: "Building your thing... this is where the magic happens.",
    he: "בונה את מה שביקשת... פה קורה הקסם.",
    pose: "magic",
  },
  // Phase 2: Iterate (steps 5-6)
  5: {
    en: "So? What do you think? Be honest.",
    he: "נו, מה אתה אומר? תהיה כנה.",
    pose: "peeking",
  },
  6: {
    en: "Saving notes so I remember you next time.",
    he: "שומר הערות כדי שאזכור אותך בפעם הבאה.",
    pose: "peeking",
  },
  // Phase 3: Ship (steps 7-9)
  7: {
    en: "Want to put this on the actual internet?",
    he: "רוצה לשים את זה באינטרנט? ברצינות?",
    pose: "peeking",
  },
  8: {
    en: "Almost there... putting your site out into the world.",
    he: "כמעט שם... שם את האתר שלך בעולם.",
    pose: "magic",
  },
  9: {
    en: "That's it. You have a website. Let that sink in.",
    he: "זהו. יש לך אתר. תן לזה לחלחל.",
    pose: "celebrating",
  },
};

interface SoulNarratorProps {
  step: number;
  locale: "he" | "en";
  visible: boolean;
}

export default function SoulNarrator({
  step,
  locale,
  visible,
}: SoulNarratorProps) {
  const narrator = narratorMessages[step];
  if (!narrator) return null;

  const text = locale === "he" ? narrator.he : narrator.en;

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={`narrator-${step}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mx-4 mb-3 flex items-start gap-3"
          dir="ltr"
        >
          {/* Mascot avatar */}
          <div className="shrink-0">
            <MascotImage
              pose={narrator.pose}
              alt=""
              width={44}
              height={44}
              className="rounded-full"
            />
          </div>

          {/* Speech bubble */}
          <div
            className="relative rounded-2xl border-2 border-dummy-black/15 bg-dummy-yellow px-4 py-2.5 shadow-sm"
            dir="auto"
          >
            {/* Tail pointing to mascot */}
            <div className="absolute -left-2 top-3 h-3 w-3 rotate-45 border-b-2 border-l-2 border-dummy-black/15 bg-dummy-yellow" />
            <p className="text-sm font-medium text-dummy-black leading-relaxed">
              {text}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
