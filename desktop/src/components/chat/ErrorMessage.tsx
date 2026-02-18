"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  content: string;
}

export default function ErrorMessage({ content }: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2"
    >
      <AlertCircle className="size-4 shrink-0 text-red-500" />
      <span className="text-sm text-red-700">{content}</span>
    </motion.div>
  );
}
