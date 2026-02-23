"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { ChatMessage } from "@/lib/store";

interface QuestionCardProps {
  message: ChatMessage;
  onAnswer: (answer: string) => void;
}

export default function QuestionCard({ message, onAnswer }: QuestionCardProps) {
  const t = useTranslations("Build");
  const questions = message.questionData?.questions;
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (qIdx: number, label: string) => {
      if (submitted) return;
      setSelections((prev) => {
        const updated = { ...prev, [qIdx]: label };
        return updated;
      });
    },
    [submitted],
  );

  const handleSubmit = useCallback(() => {
    if (!questions || submitted) return;
    setSubmitted(true);
    const answer = questions
      .map((q, i) => `${q.question}: ${selections[i]}`)
      .join("\n");
    onAnswer(answer);
  }, [questions, selections, submitted, onAnswer]);

  const hasQuestions = !!questions && questions.length > 0;
  const allAnswered = hasQuestions && Object.keys(selections).length === questions.length;

  useEffect(() => {
    if (!hasQuestions) return;

    const el = cardRef.current;
    if (!el) return;

    const frame = window.requestAnimationFrame(() => {
      const container = el.closest("[data-chat-scroll-container='true']") as HTMLElement | null;
      if (container) {
        const bottom = el.offsetTop + el.offsetHeight + 16;
        const top = Math.max(0, bottom - container.clientHeight);
        container.scrollTo({ top, behavior: "smooth" });
        return;
      }

      el.scrollIntoView({ behavior: "smooth", block: "end" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selections, submitted, allAnswered, hasQuestions]);

  if (!hasQuestions) return null;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 pb-1"
    >
      {questions.map((q, qIdx) => (
        <div key={qIdx} className="card-brand p-4" dir="auto">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-dummy-black text-xs font-bold text-dummy-yellow">
              {selections[qIdx] ? "✓" : qIdx + 1}
            </span>
            <p className="text-sm font-bold text-dummy-black">{q.question}</p>
          </div>
          <div className="flex flex-wrap gap-2" dir="auto">
            {q.options.map((opt, oIdx) => {
              const isSelected = selections[qIdx] === opt.label;
              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelect(qIdx, opt.label)}
                  disabled={submitted}
                  dir="auto"
                  className={`rounded-xl border-2 border-dummy-black px-4 py-2 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dummy-black ${
                    isSelected
                      ? "bg-dummy-black text-dummy-yellow"
                      : submitted
                        ? "cursor-default opacity-50"
                        : "bg-dummy-yellow text-dummy-black hover:bg-dummy-black hover:text-dummy-yellow"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {allAnswered && !submitted && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={handleSubmit}
          className="w-full rounded-xl border-2 border-dummy-black bg-dummy-black px-6 py-3 text-sm font-bold text-dummy-yellow transition-all hover:bg-dummy-yellow hover:text-dummy-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dummy-black"
        >
          {t("continue")}
        </motion.button>
      )}
    </motion.div>
  );
}
