"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import MascotImage from "@/components/brand/MascotImage";

interface AssistantMessageProps {
  content: string;
}

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc ps-5 text-sm">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal ps-5 text-sm">{children}</ol>
  ),
  li: ({ children }) => <li className="mb-1">{children}</li>,
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg bg-dummy-black px-3 py-2 text-xs text-dummy-yellow">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-dummy-black/10 px-1.5 py-0.5 text-xs font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="mb-2 last:mb-0">{children}</pre>,
  a: ({ href, children }) => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        if (href) {
          window.electronAPI?.openExternal?.(href);
        }
      }}
      className="text-blue-600 underline hover:text-blue-800 cursor-pointer"
    >
      {children}
    </a>
  ),
  h1: ({ children }) => (
    <h1 className="mb-2 text-base font-bold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 text-sm font-bold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 text-sm font-semibold">{children}</h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-s-2 border-dummy-black/20 ps-3 text-sm italic text-dummy-black/70">
      {children}
    </blockquote>
  ),
};

export default function AssistantMessage({ content }: AssistantMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 justify-start"
      dir="ltr"
    >
      <div className="shrink-0">
        <MascotImage
          pose="peeking"
          alt=""
          width={36}
          height={36}
          className="rounded-full"
        />
      </div>
      <div className="max-w-[80%] rounded-2xl border-2 border-dummy-black/10 bg-dummy-white px-4 py-3 text-dummy-black shadow-sm" dir="auto">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}
