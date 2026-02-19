"use client";

import { motion } from "framer-motion";
import type { ChatMessage } from "@/lib/store";

interface QuestionCardProps {
  message: ChatMessage;
  onAnswer: (answer: string) => void;
}

export default function QuestionCard({ message, onAnswer }: QuestionCardProps) {
  const questions = message.questionData?.questions;
  if (!questions || questions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      dir="ltr"
    >
      {message.questionData.questions.map((q, qIdx) => (
        <div key={qIdx} className="card-brand p-4">
          <p className="mb-3 text-sm font-bold text-dummy-black">
            {q.question}
          </p>
          <div className="flex flex-wrap gap-2">
            {q.options.map((opt, oIdx) => (
              <button
                key={oIdx}
                onClick={() => onAnswer(opt.label)}
                className="rounded-xl border-2 border-dummy-black bg-dummy-yellow px-4 py-2 text-sm font-bold text-dummy-black transition-all hover:bg-dummy-black hover:text-dummy-yellow"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
