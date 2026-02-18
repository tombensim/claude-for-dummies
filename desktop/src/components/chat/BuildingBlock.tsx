"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Hammer, Loader2 } from "lucide-react";
import type { ActivityBlock } from "@/lib/activity-blocks";

interface BuildingBlockProps {
  block: ActivityBlock;
}

export default function BuildingBlock({ block }: BuildingBlockProps) {
  const [expanded, setExpanded] = useState(block.isActive);
  const fileCount = block.filesChanged?.length || 0;

  // Summary label
  const lastMsg = block.messages[block.messages.length - 1];
  const summaryText = lastMsg?.content || "Building...";

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-s-3 border-dummy-black/20 bg-dummy-black/5 px-3 py-2"
    >
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-start"
      >
        {block.isActive ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-dummy-black/50" />
        ) : (
          <Hammer className="size-4 shrink-0 text-dummy-black/50" />
        )}
        <span className="flex-1 truncate text-sm text-dummy-black/70">
          {summaryText}
        </span>
        {fileCount > 0 && (
          <span className="shrink-0 text-xs text-dummy-black/40">
            {fileCount} {fileCount === 1 ? "file" : "files"}
          </span>
        )}
        <ChevronDown
          className={`size-4 shrink-0 text-dummy-black/40 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1 border-t border-dummy-black/10 pt-2">
              {block.messages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-center gap-2 text-xs text-dummy-black/50"
                >
                  <span className="size-1 shrink-0 rounded-full bg-dummy-black/30" />
                  <span className="truncate">{msg.content}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
