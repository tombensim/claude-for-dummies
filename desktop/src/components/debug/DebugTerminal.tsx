"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ArrowDownToLine, Search } from "lucide-react";
import { useDebugStore, type RawEvent } from "@/lib/debug-store";

const TYPE_COLORS: Record<string, string> = {
  assistant: "#7ee787",
  user: "#d2a8ff",
  result: "#79c0ff",
  error: "#ff7b72",
  system: "#8b949e",
  rate_limit_event: "#8b949e",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);
}

function summarize(event: RawEvent): string {
  const { type, raw } = event;

  if (type === "assistant") {
    const message = raw.message as Record<string, unknown> | undefined;
    const content = message?.content as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(content)) {
      const parts = content.map((b) => {
        if (b.type === "text") return `text(${((b.text as string) || "").length} chars)`;
        if (b.type === "tool_use") return `tool:${b.name as string}`;
        return String(b.type);
      });
      return parts.join(", ");
    }
  }

  if (type === "result") {
    const parts: string[] = [];
    if (raw.num_turns) parts.push(`${raw.num_turns} turns`);
    if (raw.total_cost_usd) parts.push(`$${(raw.total_cost_usd as number).toFixed(4)}`);
    if (raw.session_id) parts.push(`session:${(raw.session_id as string).slice(0, 8)}...`);
    return parts.join(" | ") || (raw.subtype as string) || "";
  }

  if (type === "error") {
    const content = (raw.content as string) || (raw.error as string) || "";
    return content.slice(0, 80);
  }

  if (type === "system") {
    return (raw.subtype as string) || "";
  }

  return "";
}

function EventRow({ event }: { event: RawEvent }) {
  const [expanded, setExpanded] = useState(false);
  const typeColor = TYPE_COLORS[event.type] || "#8b949e";

  return (
    <div className="border-b border-[#21262d] hover:bg-[#161b22]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-1 text-left font-mono text-xs flex items-center gap-3 cursor-pointer"
      >
        <span className="text-[#484f58] shrink-0 w-[85px]">
          {formatTime(event.timestamp)}
        </span>
        <span className="text-[#484f58] shrink-0 w-[32px] text-right">
          #{event.seq}
        </span>
        <span
          className="shrink-0 w-[100px] font-semibold"
          style={{ color: typeColor }}
        >
          {event.type}
        </span>
        <span className="text-[#c9d1d9] truncate">
          {summarize(event)}
        </span>
        <span className="ml-auto text-[#484f58] shrink-0">
          {expanded ? "\u25B4" : "\u25BE"}
        </span>
      </button>
      {expanded && (
        <pre className="px-3 py-2 text-[10px] leading-relaxed text-[#c9d1d9] bg-[#0d1117] overflow-x-auto max-h-[300px] overflow-y-auto border-t border-[#21262d]">
          {JSON.stringify(event.raw, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function DebugTerminal() {
  const { events, isOpen, filter, autoScroll, clearEvents, toggleOpen, setFilter, setAutoScroll } =
    useDebugStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = filter
    ? events.filter((e) => {
        const text = `${e.type} ${summarize(e)} ${JSON.stringify(e.raw)}`;
        return text.toLowerCase().includes(filter.toLowerCase());
      })
    : events;

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filtered.length, autoScroll]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-[#0d1117] border-t-2 border-[#30363d] shadow-2xl"
          style={{ height: "40vh" }}
          dir="ltr"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] shrink-0">
            <span className="text-[#c9d1d9] text-xs font-semibold tracking-wide">
              Debug Terminal
            </span>
            <span className="text-[#484f58] text-xs">
              {filtered.length}{filter ? `/${events.length}` : ""} events
            </span>

            {/* Filter */}
            <div className="flex items-center gap-1 ml-4 bg-[#0d1117] border border-[#30363d] rounded px-2 py-0.5">
              <Search size={12} className="text-[#484f58]" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter..."
                className="bg-transparent text-[#c9d1d9] text-xs outline-none w-32 placeholder:text-[#484f58]"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Auto-scroll toggle */}
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`p-1 rounded hover:bg-[#21262d] ${
                  autoScroll ? "text-[#79c0ff]" : "text-[#484f58]"
                }`}
                title="Auto-scroll"
              >
                <ArrowDownToLine size={14} />
              </button>

              {/* Clear */}
              <button
                onClick={clearEvents}
                className="p-1 rounded hover:bg-[#21262d] text-[#484f58] hover:text-[#c9d1d9]"
                title="Clear events"
              >
                <Trash2 size={14} />
              </button>

              {/* Close */}
              <button
                onClick={toggleOpen}
                className="p-1 rounded hover:bg-[#21262d] text-[#484f58] hover:text-[#c9d1d9]"
                title="Close (Cmd+Shift+D)"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Event list */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#484f58] text-xs">
                {events.length === 0
                  ? "Waiting for events... Start a build session to see raw Claude CLI events."
                  : "No events match filter."}
              </div>
            ) : (
              filtered.map((event) => (
                <EventRow key={event.seq} event={event} />
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
