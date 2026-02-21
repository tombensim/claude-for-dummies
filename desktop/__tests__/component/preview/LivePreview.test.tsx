import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAppStore } from "@/lib/store";
import LivePreview from "@/components/preview/LivePreview";

beforeEach(() => {
  useAppStore.setState(useAppStore.getInitialState());
});

describe("LivePreview", () => {
  it("shows placeholder when no previewUrl", () => {
    render(<LivePreview />);
    expect(screen.getByText("Starting your preview...")).toBeInTheDocument();
  });

  it("shows iframe when previewUrl is set", () => {
    useAppStore.setState({ previewUrl: "http://localhost:3000" });
    render(<LivePreview />);

    const iframe = screen.getByTitle("Preview");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "http://localhost:3000");
  });

  it("toggles between desktop and mobile mode", async () => {
    const user = userEvent.setup();
    useAppStore.setState({ previewUrl: "http://localhost:3000" });

    render(<LivePreview />);

    // Default is desktop
    expect(useAppStore.getState().previewMode).toBe("desktop");

    // Click mobile button
    const mobileBtn = screen.getByRole("button", { name: "Mobile view" });
    await user.click(mobileBtn);
    expect(useAppStore.getState().previewMode).toBe("mobile");

    // Click desktop button
    const desktopBtn = screen.getByRole("button", { name: "Desktop view" });
    await user.click(desktopBtn);
    expect(useAppStore.getState().previewMode).toBe("desktop");
  });

  it("has a refresh button", () => {
    render(<LivePreview />);
    expect(screen.getByRole("button", { name: "Refresh preview" })).toBeInTheDocument();
  });
});
