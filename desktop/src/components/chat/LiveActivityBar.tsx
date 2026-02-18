"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function LiveActivityBar() {
  const currentActivity = useAppStore((s) => s.currentActivity);
  const isStreaming = useAppStore((s) => s.isStreaming);

  const visible = isStreaming && currentActivity;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-t border-dummy-black/10 bg-dummy-yellow-bright/40"
        >
          <div className="flex items-center gap-2 px-4 py-2">
            <Loader2 className="size-4 animate-spin text-dummy-black/50" />
            <span className="text-xs text-dummy-black/60">
              {currentActivity}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
