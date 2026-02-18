import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAppStore } from "@/lib/store";

// Mock the heavy sub-components to isolate ChatPanel
vi.mock("@/components/chat/ChatHistory", () => ({
  default: ({ onAnswer }: { onAnswer: (a: string) => void }) => (
    <div data-testid="chat-history" />
  ),
}));
vi.mock("@/components/chat/LiveActivityBar", () => ({
  default: () => <div data-testid="live-activity-bar" />,
}));
vi.mock("@/components/chat/ConversationRecoveryBanner", () => ({
  default: ({ show }: { show: boolean }) =>
    show ? <div data-testid="recovery-banner" /> : null,
}));
// ChatInput is the component we actually want to exercise
vi.mock("@/components/brand/MascotImage", () => ({
  default: (props: Record<string, unknown>) => (
    <img data-testid="mascot" alt={props.alt as string} />
  ),
}));

import ChatPanel from "@/components/chat/ChatPanel";

beforeEach(() => {
  useAppStore.setState(useAppStore.getInitialState());
});

describe("ChatPanel", () => {
  it("renders ChatHistory, LiveActivityBar, and ChatInput", () => {
    render(<ChatPanel onSend={vi.fn()} />);
    expect(screen.getByTestId("chat-history")).toBeInTheDocument();
    expect(screen.getByTestId("live-activity-bar")).toBeInTheDocument();
    // ChatInput renders a text input
    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
  });

  it("shows recovery banner when prop is set", () => {
    render(<ChatPanel onSend={vi.fn()} showRecoveryBanner />);
    expect(screen.getByTestId("recovery-banner")).toBeInTheDocument();
  });

  it("hides recovery banner by default", () => {
    render(<ChatPanel onSend={vi.fn()} />);
    expect(screen.queryByTestId("recovery-banner")).not.toBeInTheDocument();
  });

  it("disables input while streaming", () => {
    useAppStore.setState({ isStreaming: true });
    render(<ChatPanel onSend={vi.fn()} />);
    const input = screen.getByPlaceholderText("Type a message...");
    expect(input).toBeDisabled();
  });

  it("calls onSend when submitting input", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatPanel onSend={onSend} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "Hello world");
    await user.keyboard("{Enter}");

    expect(onSend).toHaveBeenCalledWith("Hello world");
  });

  it("clears input after submit", async () => {
    const user = userEvent.setup();
    render(<ChatPanel onSend={vi.fn()} />);

    const input = screen.getByPlaceholderText("Type a message...");
    await user.type(input, "Hello");
    await user.keyboard("{Enter}");

    expect(input).toHaveValue("");
  });

  it("does not send empty messages", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatPanel onSend={onSend} />);

    await user.keyboard("{Enter}");
    expect(onSend).not.toHaveBeenCalled();
  });
});
