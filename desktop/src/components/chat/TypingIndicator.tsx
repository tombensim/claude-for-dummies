"use client";

import { motion } from "framer-motion";
import MascotImage from "@/components/brand/MascotImage";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">
        <MascotImage
          pose="peeking"
          alt=""
          width={36}
          height={36}
          className="rounded-full"
        />
      </div>
      <div className="flex items-center gap-1 rounded-2xl bg-dummy-white px-4 py-3 shadow-sm border-2 border-dummy-black/10">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="size-2 rounded-full bg-dummy-black/40"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}
