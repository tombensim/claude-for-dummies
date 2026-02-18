"use client";

import type { ActivityBlock } from "@/lib/activity-blocks";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";
import BuildingBlock from "./BuildingBlock";
import QuestionCard from "./QuestionCard";
import ErrorMessage from "./ErrorMessage";

interface ActivityBlockViewProps {
  block: ActivityBlock;
  onAnswer: (answer: string) => void;
}

export default function ActivityBlockView({
  block,
  onAnswer,
}: ActivityBlockViewProps) {
  switch (block.type) {
    case "user-input":
      return (
        <>
          {block.messages.map((msg) => (
            <UserMessage key={msg.id} content={msg.content} images={msg.images} />
          ))}
        </>
      );

    case "assistant":
      return (
        <>
          {block.messages.map((msg) => (
            <AssistantMessage key={msg.id} content={msg.content} />
          ))}
        </>
      );

    case "building":
      return <BuildingBlock block={block} />;

    case "question":
      return (
        <>
          {block.messages.map((msg) =>
            msg.questionData ? (
              <QuestionCard key={msg.id} message={msg} onAnswer={onAnswer} />
            ) : null
          )}
        </>
      );

    case "error":
      return (
        <>
          {block.messages.map((msg) => (
            <ErrorMessage key={msg.id} content={msg.content} />
          ))}
        </>
      );

    default:
      return null;
  }
}
