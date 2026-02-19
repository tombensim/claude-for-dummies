"use client";

import { motion } from "framer-motion";
import type { ImageAttachment } from "@/lib/store";

interface UserMessageProps {
  content: string;
  images?: ImageAttachment[];
}

export default function UserMessage({ content, images }: UserMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 justify-end"
      dir="ltr"
    >
      <div className="max-w-[80%] rounded-2xl bg-dummy-black px-4 py-3 text-dummy-yellow" dir="auto">
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
