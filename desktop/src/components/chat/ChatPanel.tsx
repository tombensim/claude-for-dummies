"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { type ImageAttachment, useAppStore } from "@/lib/store";
import ChatHistory from "./ChatHistory";
import LiveActivityBar from "./LiveActivityBar";
import ChatInput from "./ChatInput";
import ConversationRecoveryBanner from "./ConversationRecoveryBanner";
import PlanningHeader from "./PlanningHeader";
import SoulNarrator from "./SoulNarrator";
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
  const currentStep = useAppStore((s) => s.currentStep);
  const locale = useAppStore((s) => s.locale);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const showChips = isWorkspaceMode || currentStep >= 5;

  // Show SoulNarrator briefly when step changes (wizard mode only)
  const [showNarrator, setShowNarrator] = useState(false);
  const lastNarratedStep = useRef(0);
  const narratorShownAt = useRef(0);

  useEffect(() => {
    if (isWorkspaceMode) return;
    if (currentStep !== lastNarratedStep.current) {
      lastNarratedStep.current = currentStep;
      narratorShownAt.current = Date.now();
      setShowNarrator(true);
      const timer = setTimeout(() => setShowNarrator(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isWorkspaceMode]);

  // Hide narrator when streaming stops, but only after minimum display time (3s).
  // Step changes happen DURING streaming (via onStepHint), so we can't hide
  // on streaming start — that would immediately cancel the narrator.
  useEffect(() => {
    if (!isStreaming && showNarrator) {
      const elapsed = Date.now() - narratorShownAt.current;
      const remaining = Math.max(0, 3000 - elapsed);
      const timer = setTimeout(() => setShowNarrator(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, showNarrator]);

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
      {!isWorkspaceMode && (
        <SoulNarrator step={currentStep} locale={locale} visible={showNarrator} />
      )}
      <ChatHistory onAnswer={handleSend} />
      <LiveActivityBar />
      {showChips && <SuggestionChips onSelect={handleChipSelect} forceShow={currentStep >= 5} />}
      <ChatInput
        onSend={handleSend}
        prefill={prefill}
        onPrefillConsumed={() => setPrefill("")}
      />
      {!isWorkspaceMode && <StepIndicator />}
    </div>
  );
}
