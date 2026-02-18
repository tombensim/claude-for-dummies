"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ChatMessage } from "@/lib/store";
import MascotImage from "@/components/brand/MascotImage";

interface MessageProps {
  message: ChatMessage;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === "user";
  const isStatus = message.role === "status";

  if (isStatus) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-2 py-1"
      >
        <Loader2 className="size-4 animate-spin text-dummy-black/50" />
        <span className="text-sm text-dummy-black/60">{message.content}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="shrink-0">
          <MascotImage
            pose="peeking"
            alt=""
            width={36}
            height={36}
            className="rounded-full"
          />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-dummy-black text-dummy-yellow"
            : "bg-dummy-white text-dummy-black shadow-sm border-2 border-dummy-black/10"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>
      </div>
    </motion.div>
  );
}
