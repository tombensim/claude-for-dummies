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
import PlanApprovalCard from "./PlanApprovalCard";
import StepIndicator from "@/components/progress/StepIndicator";

interface ChatPanelProps {
  onSend: (message: string, images?: ImageAttachment[]) => void;
  showRecoveryBanner?: boolean;
  isWorkspaceMode?: boolean;
  onApprovePlan?: () => void;
}

export default function ChatPanel({
  onSend,
  showRecoveryBanner = false,
  isWorkspaceMode = false,
  onApprovePlan,
}: ChatPanelProps) {
  const [prefill, setPrefill] = useState("");
  const currentStep = useAppStore((s) => s.currentStep);
  const locale = useAppStore((s) => s.locale);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const buildMode = useAppStore((s) => s.buildMode);
  const messages = useAppStore((s) => s.messages);
  const showChips = isWorkspaceMode || currentStep >= 5;

  // Show plan approval card only after a real planning flow:
  // 1) assistant signals readiness,
  // 2) recent assistant output includes plan-summary language,
  // 3) discovery happened (structured cards or multiple user replies),
  // 4) if there was a structured question, user answered after the latest one.
  const assistantMessages = messages.filter(
    (m) => m.role === "assistant" && !m.toolName
  );
  const lastAssistantMsg = assistantMessages[assistantMessages.length - 1];
  const lastQuestionIdx = messages.findLastIndex((m) => !!m.questionData);
  const hasStructuredQuestionFlow = lastQuestionIdx >= 0;
  const hasDiscoveryReplies = messages.filter((m) => m.role === "user").length >= 2;
  const hasAnsweredLatestStructuredQuestion =
    lastQuestionIdx < 0 ||
    messages.slice(lastQuestionIdx + 1).some((m) => m.role === "user");
  const planReadySignals = [
    "sound good",
    "נשמע טוב",
    "נשמע לך",
    "מה דעתך",
    "מתאים לך",
    "shall we",
    "ready to",
    "let's build",
    "נתחיל",
    "יאללה",
  ];
  const planSummarySignals = [
    "plan",
    "summary",
    "milestones",
    "scope",
    "תוכנית",
    "תכנית",
    "סיכום",
    "שלבים",
  ];
  const hasPlanReadySignal =
    !!lastAssistantMsg &&
    planReadySignals.some((signal) =>
      lastAssistantMsg.content.toLowerCase().includes(signal)
    );
  const recentAssistantMsgs = assistantMessages.slice(-4);
  const hasPlanSummarySignal = recentAssistantMsgs.some((msg) =>
    planSummarySignals.some((signal) =>
      msg.content.toLowerCase().includes(signal)
    )
  );
  const showPlanApproval =
    !isWorkspaceMode &&
    buildMode === "plan" &&
    !isStreaming &&
    hasPlanReadySignal &&
    hasPlanSummarySignal &&
    (hasStructuredQuestionFlow || hasDiscoveryReplies) &&
    hasAnsweredLatestStructuredQuestion;

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
      {showPlanApproval && onApprovePlan && <PlanApprovalCard onApprove={onApprovePlan} />}
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
