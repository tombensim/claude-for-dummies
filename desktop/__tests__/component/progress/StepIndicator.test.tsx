import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useAppStore } from "@/lib/store";
import StepIndicator from "@/components/progress/StepIndicator";

beforeEach(() => {
  useAppStore.setState(useAppStore.getInitialState());
});

describe("StepIndicator", () => {
  it("renders all 4 phase labels", () => {
    render(<StepIndicator />);
    expect(screen.getByText("Setup")).toBeInTheDocument();
    expect(screen.getByText("Build")).toBeInTheDocument();
    expect(screen.getByText("Improve")).toBeInTheDocument();
    expect(screen.getByText("Launch")).toBeInTheDocument();
  });

  it("progress bar is 0% with no completed steps", () => {
    render(<StepIndicator />);
    // Progress bar inner element should have width 0%
    const progressBars = document.querySelectorAll("[style]");
    const bar = Array.from(progressBars).find((el) =>
      (el as HTMLElement).style.width.includes("%")
    );
    expect(bar).toBeDefined();
    expect((bar as HTMLElement).style.width).toBe("0%");
  });

  it("progress bar reflects completed steps", () => {
    useAppStore.setState({ completedSteps: [1, 2, 3] });
    render(<StepIndicator />);

    const progressBars = document.querySelectorAll("[style]");
    const bar = Array.from(progressBars).find((el) =>
      (el as HTMLElement).style.width.includes("%")
    );
    // 3/9 * 100 = 33.333...%
    expect(bar).toBeDefined();
    const width = parseFloat((bar as HTMLElement).style.width);
    expect(width).toBeCloseTo(33.33, 0);
  });

  it("shows 100% when all 9 steps completed", () => {
    useAppStore.setState({ completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9] });
    render(<StepIndicator />);

    const progressBars = document.querySelectorAll("[style]");
    const bar = Array.from(progressBars).find((el) =>
      (el as HTMLElement).style.width.includes("%")
    );
    expect((bar as HTMLElement).style.width).toBe("100%");
  });
});
