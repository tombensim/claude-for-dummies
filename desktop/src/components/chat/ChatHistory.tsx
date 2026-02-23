"use client";

import { useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store";
import { buildActivityBlocks } from "@/lib/activity-blocks";
import ActivityBlockView from "./ActivityBlockView";

interface ChatHistoryProps {
  onAnswer: (answer: string) => void;
}

export default function ChatHistory({ onAnswer }: ChatHistoryProps) {
  const t = useTranslations("Build");
  const messages = useAppStore((s) => s.messages);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);

  const blocks = useMemo(() => {
    const built = buildActivityBlocks(messages);
    if (isStreaming && built.length > 0) {
      built[built.length - 1] = {
        ...built[built.length - 1],
        isActive: true,
      };
    }
    return built;
  }, [messages, isStreaming]);

  function isNearBottom(el: HTMLElement, threshold = 64) {
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  }

  useEffect(() => {
    if (!shouldStickToBottomRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        return;
      }
      container.scrollTo({
        top: container.scrollHeight,
        behavior: isStreaming ? "auto" : "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, isStreaming]);

  function handleScroll() {
    const container = scrollContainerRef.current;
    if (!container) return;
    shouldStickToBottomRef.current = isNearBottom(container);
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      data-chat-scroll-container="true"
      className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4 pb-6"
      role="log"
      aria-label={t("chatRegion")}
      aria-live="polite"
    >
      {blocks.map((block) => (
        <ActivityBlockView key={block.id} block={block} onAnswer={onAnswer} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
