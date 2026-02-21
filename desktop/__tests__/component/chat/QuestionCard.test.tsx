import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionCard from "@/components/chat/QuestionCard";
import type { ChatMessage } from "@/lib/store";

describe("QuestionCard", () => {
  it("returns null when no questionData", () => {
    const message: ChatMessage = {
      id: "q1",
      role: "assistant",
      content: "",
      timestamp: 1000,
    };
    const { container } = render(
      <QuestionCard message={message} onAnswer={vi.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("returns null when questions is undefined", () => {
    const message: ChatMessage = {
      id: "q1",
      role: "assistant",
      content: "",
      timestamp: 1000,
      questionData: undefined,
    };
    const { container } = render(
      <QuestionCard message={message} onAnswer={vi.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders question text and option buttons", () => {
    const message: ChatMessage = {
      id: "q1",
      role: "assistant",
      content: "",
      timestamp: 1000,
      questionData: {
        questions: [
          {
            question: "What style?",
            options: [
              { label: "Bold", description: "Stand out" },
              { label: "Clean", description: "Minimal look" },
            ],
          },
        ],
      },
    };

    render(<QuestionCard message={message} onAnswer={vi.fn()} />);
    expect(screen.getByText("What style?")).toBeInTheDocument();
    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText("Clean")).toBeInTheDocument();
  });

  it("submits combined answers after continue", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();

    const message: ChatMessage = {
      id: "q1",
      role: "assistant",
      content: "",
      timestamp: 1000,
      questionData: {
        questions: [
          {
            question: "Pick one",
            options: [
              { label: "Option A", description: "First" },
              { label: "Option B", description: "Second" },
            ],
          },
          {
            question: "Pick color",
            options: [
              { label: "Red", description: "Warm" },
              { label: "Blue", description: "Cool" },
            ],
          },
        ],
      },
    };

    render(<QuestionCard message={message} onAnswer={onAnswer} />);
    await user.click(screen.getByText("Option A"));
    expect(onAnswer).not.toHaveBeenCalled();
    await user.click(screen.getByText("Red"));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onAnswer).toHaveBeenCalledWith("Pick one: Option A\nPick color: Red");
  });

  it("renders multiple questions", () => {
    const message: ChatMessage = {
      id: "q1",
      role: "assistant",
      content: "",
      timestamp: 1000,
      questionData: {
        questions: [
          {
            question: "Question 1",
            options: [{ label: "A", description: "" }],
          },
          {
            question: "Question 2",
            options: [{ label: "B", description: "" }],
          },
        ],
      },
    };

    render(<QuestionCard message={message} onAnswer={vi.fn()} />);
    expect(screen.getByText("Question 1")).toBeInTheDocument();
    expect(screen.getByText("Question 2")).toBeInTheDocument();
  });
});
