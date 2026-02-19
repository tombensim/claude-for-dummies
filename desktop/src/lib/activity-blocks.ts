import type { ChatMessage } from "./store";

export interface ActivityBlock {
  id: string;
  type: "user-input" | "assistant" | "building" | "question" | "error";
  messages: ChatMessage[];
  isActive: boolean;
  filesChanged?: string[];
}

function extractFilePath(msg: ChatMessage): string | undefined {
  return msg.toolInput?.file_path;
}

function getBlockType(
  msg: ChatMessage
): ActivityBlock["type"] {
  if (msg.role === "user") return "user-input";
  if (msg.questionData) return "question";
  if (msg.id.startsWith("error-")) return "error";
  if (msg.role === "status") return "building";
  return "assistant";
}

function createBlock(msg: ChatMessage, index: number): ActivityBlock {
  const type = getBlockType(msg);
  const filePath = extractFilePath(msg);
  return {
    id: `block-${index}`,
    type,
    messages: [msg],
    isActive: false,
    filesChanged: filePath ? [filePath] : [],
  };
}

/**
 * Full rebuild of activity blocks from a messages array.
 */
export function buildActivityBlocks(messages: ChatMessage[]): ActivityBlock[] {
  const blocks: ActivityBlock[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const type = getBlockType(msg);
    const last = blocks[blocks.length - 1];

    // Try to merge into current block
    if (last && last.type === type && type === "building") {
      last.messages.push(msg);
      const fp = extractFilePath(msg);
      if (fp && last.filesChanged && !last.filesChanged.includes(fp)) {
        last.filesChanged.push(fp);
      }
      continue;
    }

    if (last && last.type === type && type === "assistant") {
      last.messages.push(msg);
      continue;
    }

    // New block
    blocks.push(createBlock(msg, i));
  }

  return blocks;
}

