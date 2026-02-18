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

/**
 * Incrementally append a message to existing blocks.
 * Returns a new blocks array (immutable).
 */
export function appendToBlocks(
  blocks: ActivityBlock[],
  msg: ChatMessage
): ActivityBlock[] {
  const type = getBlockType(msg);
  const last = blocks[blocks.length - 1];

  // Deactivate previous active block if we're starting a new type
  const deactivated = blocks.map((b) =>
    b.isActive ? { ...b, isActive: false } : b
  );

  // Try to merge
  if (last && last.type === type && (type === "building" || type === "assistant")) {
    const updated = [...deactivated];
    const lastBlock = { ...updated[updated.length - 1] };
    lastBlock.messages = [...lastBlock.messages, msg];
    lastBlock.isActive = true;
    if (type === "building") {
      const fp = extractFilePath(msg);
      if (fp && lastBlock.filesChanged && !lastBlock.filesChanged.includes(fp)) {
        lastBlock.filesChanged = [...lastBlock.filesChanged, fp];
      }
    }
    updated[updated.length - 1] = lastBlock;
    return updated;
  }

  // New block
  const filePath = extractFilePath(msg);
  return [
    ...deactivated,
    {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type,
      messages: [msg],
      isActive: true,
      filesChanged: filePath ? [filePath] : [],
    },
  ];
}
