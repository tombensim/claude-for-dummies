"use client";

import { useRef, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { buildActivityBlocks } from "@/lib/activity-blocks";
import ActivityBlockView from "./ActivityBlockView";

interface ChatHistoryProps {
  onAnswer: (answer: string) => void;
}

export default function ChatHistory({ onAnswer }: ChatHistoryProps) {
  const messages = useAppStore((s) => s.messages);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const blocks = useMemo(() => {
    const built = buildActivityBlocks(messages);
    // Mark last block as active if we're streaming
    if (isStreaming && built.length > 0) {
      built[built.length - 1] = {
        ...built[built.length - 1],
        isActive: true,
      };
    }
    return built;
  }, [messages, isStreaming]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {blocks.map((block) => (
        <ActivityBlockView key={block.id} block={block} onAnswer={onAnswer} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
