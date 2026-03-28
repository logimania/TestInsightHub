import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  useProgress,
  ProgressBarGlobal,
} from "../../../../src/renderer/components/progress-bar-global";

describe("useProgress store", () => {
  beforeEach(() => {
    useProgress.getState().finish();
  });

  it("has correct initial state", () => {
    const state = useProgress.getState();
    expect(state.isActive).toBe(false);
    expect(state.message).toBe("");
    expect(state.percentage).toBeNull();
  });

  describe("start", () => {
    it("activates with message", () => {
      useProgress.getState().start("Loading...");
      const state = useProgress.getState();
      expect(state.isActive).toBe(true);
      expect(state.message).toBe("Loading...");
      expect(state.percentage).toBeNull();
    });
  });

  describe("update", () => {
    it("updates message and percentage", () => {
      useProgress.getState().start("Loading...");
      useProgress.getState().update("50% done", 50);
      const state = useProgress.getState();
      expect(state.isActive).toBe(true);
      expect(state.message).toBe("50% done");
      expect(state.percentage).toBe(50);
    });

    it("sets percentage to null when not provided", () => {
      useProgress.getState().start("Loading...");
      useProgress.getState().update("still loading");
      expect(useProgress.getState().percentage).toBeNull();
    });
  });

  describe("finish", () => {
    it("deactivates and clears state", () => {
      useProgress.getState().start("Loading...");
      useProgress.getState().update("Working", 75);
      useProgress.getState().finish();
      const state = useProgress.getState();
      expect(state.isActive).toBe(false);
      expect(state.message).toBe("");
      expect(state.percentage).toBeNull();
    });
  });
});

describe("ProgressBarGlobal component", () => {
  beforeEach(() => {
    useProgress.getState().finish();
  });

  it("renders nothing when inactive", () => {
    const { container } = render(<ProgressBarGlobal />);
    expect(container.querySelector(".global-progress")).toBeNull();
  });

  it("renders progress bar when active", () => {
    useProgress.getState().start("Loading...");
    const { container } = render(<ProgressBarGlobal />);
    expect(container.querySelector(".global-progress")).not.toBeNull();
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders indeterminate bar when no percentage", () => {
    useProgress.getState().start("Working...");
    const { container } = render(<ProgressBarGlobal />);
    expect(
      container.querySelector(".global-progress-indeterminate"),
    ).not.toBeNull();
  });

  it("renders determinate bar with percentage", () => {
    useProgress.getState().update("50% done", 50);
    const { container } = render(<ProgressBarGlobal />);
    const fill = container.querySelector(
      ".global-progress-fill",
    ) as HTMLElement;
    expect(fill).not.toBeNull();
    expect(fill.style.width).toBe("50%");
  });
});
