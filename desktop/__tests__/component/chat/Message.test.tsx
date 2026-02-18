import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Message from "@/components/chat/Message";

vi.mock("@/components/brand/MascotImage", () => ({
  default: (props: Record<string, unknown>) => (
    <img data-testid="mascot" alt={props.alt as string} />
  ),
}));

describe("Message", () => {
  it("renders status messages with spinner text", () => {
    render(
      <Message
        message={{
          id: "s1",
          role: "status",
          content: "Building...",
          timestamp: 1000,
        }}
      />
    );
    expect(screen.getByText("Building...")).toBeInTheDocument();
  });

  it("renders user messages", () => {
    render(
      <Message
        message={{
          id: "u1",
          role: "user",
          content: "Hello",
          timestamp: 1000,
        }}
      />
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    // User messages should NOT have mascot avatar
    expect(screen.queryByTestId("mascot")).not.toBeInTheDocument();
  });

  it("renders assistant messages with mascot avatar", () => {
    render(
      <Message
        message={{
          id: "a1",
          role: "assistant",
          content: "Hi there",
          timestamp: 1000,
        }}
      />
    );
    expect(screen.getByText("Hi there")).toBeInTheDocument();
    expect(screen.getByTestId("mascot")).toBeInTheDocument();
  });

  it("preserves whitespace in content", () => {
    render(
      <Message
        message={{
          id: "a2",
          role: "assistant",
          content: "Line 1\nLine 2",
          timestamp: 1000,
        }}
      />
    );
    // getByText with exact=false handles text split across DOM nodes
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    expect(screen.getByText(/Line 2/)).toBeInTheDocument();
    // The wrapping element has whitespace-pre-wrap
    const p = screen.getByText(/Line 1/).closest("p");
    expect(p?.className).toContain("whitespace-pre-wrap");
  });
});
