import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PhaseLabel from "@/components/progress/PhaseLabel";

describe("PhaseLabel", () => {
  it("renders label text", () => {
    render(<PhaseLabel label="Setup" isActive={false} isDone={false} />);
    expect(screen.getByText("Setup")).toBeInTheDocument();
  });

  it("shows checkmark when isDone", () => {
    const { container } = render(
      <PhaseLabel label="Build" isActive={false} isDone={true} />
    );
    // Check icon is rendered as an SVG with lucide classes
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("does not show checkmark when not done", () => {
    const { container } = render(
      <PhaseLabel label="Build" isActive={true} isDone={false} />
    );
    const svg = container.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  it("applies active styling (ring)", () => {
    const { container } = render(
      <PhaseLabel label="Build" isActive={true} isDone={false} />
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("ring-2");
  });

  it("applies done styling (dark bg)", () => {
    const { container } = render(
      <PhaseLabel label="Build" isActive={false} isDone={true} />
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("bg-dummy-black");
    expect(el.className).toContain("text-dummy-yellow");
  });

  it("applies faded styling when neither active nor done", () => {
    const { container } = render(
      <PhaseLabel label="Launch" isActive={false} isDone={false} />
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("text-dummy-black/40");
  });
});
