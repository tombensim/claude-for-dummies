"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { type ImageAttachment } from "@/lib/store";
import ChatHistory from "./ChatHistory";
import LiveActivityBar from "./LiveActivityBar";
import ChatInput from "./ChatInput";
import ConversationRecoveryBanner from "./ConversationRecoveryBanner";
import PlanningHeader from "./PlanningHeader";
import SuggestionChips from "./SuggestionChips";
import StepIndicator from "@/components/progress/StepIndicator";

interface ChatPanelProps {
  onSend: (message: string, images?: ImageAttachment[]) => void;
  showRecoveryBanner?: boolean;
  isWorkspaceMode?: boolean;
}

export default function ChatPanel({
  onSend,
  showRecoveryBanner = false,
  isWorkspaceMode = false,
}: ChatPanelProps) {
  const [prefill, setPrefill] = useState("");

  function handleChipSelect(text: string) {
    setPrefill(text);
  }

  function handleSend(message: string, images?: ImageAttachment[]) {
    setPrefill("");
    onSend(message, images);
  }

  return (
    <div className="relative flex h-full flex-col">
      <ConversationRecoveryBanner show={showRecoveryBanner} />
      {!isWorkspaceMode && <PlanningHeader />}
      <ChatHistory onAnswer={handleSend} />
      <LiveActivityBar />
      {isWorkspaceMode && <SuggestionChips onSelect={handleChipSelect} />}
      <ChatInput
        onSend={handleSend}
        prefill={prefill}
        onPrefillConsumed={() => setPrefill("")}
      />
      {!isWorkspaceMode && <StepIndicator />}
    </div>
  );
}
