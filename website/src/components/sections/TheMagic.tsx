"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import FadeIn from "@/components/ui/FadeIn";
import MascotImage from "@/components/ui/MascotImage";

interface ChatMessage {
  type: "user" | "ai";
  text: string;
}

function TypewriterText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");

  const stableOnDone = useCallback(() => onDone?.(), [onDone]);

  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        stableOnDone();
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text, stableOnDone]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="cursor-blink">|</span>
      )}
    </span>
  );
}

function ClaudeMockup({
  stage,
  cta,
  tabChat,
  tabCowork,
  tabCode,
}: {
  stage: number;
  cta: string;
  tabChat: string;
  tabCowork: string;
  tabCode: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border-4 border-dummy-black bg-[#2B2B2B] shadow-[8px_8px_0_0_#1A1A1A]">
      {/* Claude Code chrome */}
      <div className="flex items-center border-b-2 border-white/10 px-4 py-2">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <div className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
          <div className="h-3 w-3 rounded-full bg-[#28CA42]" />
        </div>
        <div className="mx-auto flex gap-1 text-[11px] font-medium">
          <span className="rounded px-2.5 py-0.5 text-white/40">{tabChat}</span>
          <span className="rounded px-2.5 py-0.5 text-white/40">{tabCowork}</span>
          <span className="rounded bg-white/10 px-2.5 py-0.5 text-white/90">{tabCode}</span>
        </div>
      </div>
      {/* Claude Code content */}
      <div className="min-h-[220px] p-5">
        <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.div
              key="blank"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-[180px] items-center justify-center"
            >
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-dummy-yellow/30 border-t-dummy-yellow" />
            </motion.div>
          )}
          {stage >= 1 && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* File creation lines */}
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <div className="h-3 w-32 rounded bg-white/20" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <div className="h-3 w-24 rounded bg-white/20" />
              </div>

              {stage >= 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="mt-3 rounded-lg border border-dummy-yellow/30 bg-dummy-yellow/10 p-5">
                    <div className="h-5 w-44 rounded bg-dummy-yellow/50" />
                    <div className="mt-2 h-3 w-60 rounded bg-white/20" />
                  </div>
                </motion.div>
              )}

              {stage >= 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-14 rounded border border-white/10 bg-white/5" />
                    <div className="h-14 rounded border border-white/10 bg-white/5" />
                    <div className="h-14 rounded border border-white/10 bg-white/5" />
                  </div>
                  <div className="flex justify-center pt-1">
                    <div className="rounded-lg border-2 border-dummy-yellow bg-dummy-yellow px-4 py-1.5 text-xs font-bold text-dummy-black">
                      {cta}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TheMagic() {
  const t = useTranslations("TheMagic");
  const [step, setStep] = useState(-1);
  const [browserStage, setBrowserStage] = useState(0);
  const [inView, setInView] = useState(false);

  const messages: ChatMessage[] = [
    { type: "user", text: t("userMsg1") },
    { type: "ai", text: t("aiMsg1") },
    { type: "user", text: t("userMsg2") },
    { type: "ai", text: t("aiMsg2") },
  ];

  useEffect(() => {
    if (!inView) return;
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setStep(0), 500));
    timers.push(setTimeout(() => setStep(1), 2500));
    timers.push(setTimeout(() => setStep(2), 4500));
    timers.push(setTimeout(() => {
      setStep(3);
      setBrowserStage(0);
    }, 6500));
    timers.push(setTimeout(() => setBrowserStage(1), 7500));
    timers.push(setTimeout(() => setBrowserStage(2), 8500));
    timers.push(setTimeout(() => setBrowserStage(3), 9500));
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <section id="magic" className="bg-dummy-black px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <h2 className="text-center font-[family-name:var(--font-display)] text-4xl text-dummy-yellow sm:text-5xl">
            {t("title")}
          </h2>
          <div className="mx-auto mt-6 max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-dummy-yellow/80 sm:text-sm">
              {t("personaEyebrow")}
            </p>
            <p className="mt-3 text-lg font-medium text-dummy-white sm:text-xl">
              {t("personaLine")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-dummy-white/75 sm:text-base">
              {t("promiseLine")}
            </p>
          </div>
        </FadeIn>

        <motion.div
          onViewportEnter={() => setInView(true)}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-12 grid items-start gap-8 md:grid-cols-2"
        >
          {/* Chat side */}
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <AnimatePresence key={i}>
                {step >= i && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium ${
                        msg.type === "user"
                          ? "rounded-ee-sm bg-dummy-yellow text-dummy-black"
                          : "rounded-es-sm border-2 border-dummy-yellow/30 bg-dummy-black-light text-dummy-white"
                      }`}
                    >
                      {step === i ? (
                        <TypewriterText text={msg.text} />
                      ) : (
                        msg.text
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>

          {/* Claude Code side */}
          <div className="relative">
            <ClaudeMockup
              stage={browserStage}
              cta={t("browserCta")}
              tabChat={t("tabChat")}
              tabCowork={t("tabCowork")}
              tabCode={t("tabCode")}
            />
            <div className="absolute -bottom-8 -start-6 hidden rotate-[-4deg] rounded-2xl border-4 border-dummy-yellow bg-[#E6E6E6] p-1 shadow-[8px_8px_0_0_#1A1A1A] md:block">
              <MascotImage
                pose="peeking"
                alt="Mascot peeking from the side of the demo"
                width={110}
                height={110}
                className="h-[110px] w-[110px]"
              />
            </div>
          </div>
        </motion.div>

        <div className="mt-6 flex justify-center md:hidden">
          <div className="rotate-[-2deg] rounded-2xl border-4 border-dummy-yellow bg-[#E6E6E6] p-1 shadow-[6px_6px_0_0_#1A1A1A]">
            <MascotImage
              pose="peeking"
              alt="Mascot peeking from the side of the demo"
              width={96}
              height={96}
              className="h-24 w-24"
            />
          </div>
        </div>

        <FadeIn delay={0.5}>
          <p className="mt-16 text-center font-[family-name:var(--font-display)] text-3xl text-dummy-white sm:text-4xl">
            {t("punchline")}
          </p>
          <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-relaxed text-dummy-white/70 sm:text-base">
            {t("supportingCopy")}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
