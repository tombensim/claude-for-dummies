import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAppStore } from "@/lib/store";
import LanguageToggle from "@/components/brand/LanguageToggle";

beforeEach(() => {
  useAppStore.setState(useAppStore.getInitialState());
});

describe("LanguageToggle", () => {
  it('shows "EN" when locale is "he"', () => {
    useAppStore.setState({ locale: "he" });
    render(<LanguageToggle />);
    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  it('shows "עב" when locale is "en"', () => {
    useAppStore.setState({ locale: "en" });
    render(<LanguageToggle />);
    expect(screen.getByText("עב")).toBeInTheDocument();
  });

  it("toggles locale on click", async () => {
    const user = userEvent.setup();
    useAppStore.setState({ locale: "he" });
    render(<LanguageToggle />);

    await user.click(screen.getByText("EN"));
    expect(useAppStore.getState().locale).toBe("en");
  });

  it("toggles back to he", async () => {
    const user = userEvent.setup();
    useAppStore.setState({ locale: "en" });
    render(<LanguageToggle />);

    await user.click(screen.getByText("עב"));
    expect(useAppStore.getState().locale).toBe("he");
  });

  it('has aria-label "Switch language"', () => {
    render(<LanguageToggle />);
    expect(screen.getByLabelText("Switch language")).toBeInTheDocument();
  });
});
