"use client";

import { motion } from "framer-motion";
import { type ImageAttachment, useAppStore } from "@/lib/store";

interface UserMessageProps {
  content: string;
  images?: ImageAttachment[];
}

export default function UserMessage({ content, images }: UserMessageProps) {
  const locale = useAppStore((s) => s.locale);
  const isRtl = locale === "he";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full justify-end gap-3"
    >
      <div
        className="max-w-[80%] overflow-hidden break-words rounded-2xl bg-dummy-black px-4 py-3 text-dummy-yellow"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {images && images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((img) => (
              <img
                key={img.id}
                src={`data:${img.mimeType};base64,${img.base64}`}
                alt={img.filename}
                className="max-h-40 max-w-48 rounded-lg object-cover"
              />
            ))}
          </div>
        )}
        {content && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </p>
        )}
      </div>
    </motion.div>
  );
}
