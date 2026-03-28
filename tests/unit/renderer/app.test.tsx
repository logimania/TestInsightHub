import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all child components to isolate App logic
vi.mock("../../../src/renderer/components/layout/menu-bar", () => ({
  MenuBar: () => <div data-testid="menu-bar" />,
}));
vi.mock("../../../src/renderer/components/layout/sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));
vi.mock("../../../src/renderer/components/layout/header", () => ({
  Header: () => <div data-testid="header" />,
}));
vi.mock("../../../src/renderer/components/toast", () => ({
  Toast: () => <div data-testid="toast" />,
}));
vi.mock("../../../src/renderer/components/progress-bar-global", () => ({
  ProgressBarGlobal: () => <div data-testid="progress-bar" />,
}));
vi.mock("../../../src/renderer/components/layout/log-panel", () => ({
  LogPanel: () => <div data-testid="log-panel" />,
}));
vi.mock("../../../src/renderer/components/keyboard-shortcut-provider", () => ({
  KeyboardShortcutProvider: () => <div data-testid="keyboard-shortcut" />,
}));
vi.mock("../../../src/renderer/components/onboarding/onboarding-wizard", () => ({
  OnboardingWizard: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="onboarding-wizard">
      <button data-testid="complete-onboarding" onClick={onComplete}>
        Complete
      </button>
    </div>
  ),
}));
vi.mock("../../../src/renderer/pages/home-page", () => ({
  HomePage: () => <div data-testid="home-page" />,
}));
vi.mock("../../../src/renderer/pages/diagram-page", () => ({
  DiagramPage: () => <div data-testid="diagram-page" />,
}));
vi.mock("../../../src/renderer/pages/coverage-page", () => ({
  CoveragePage: () => <div data-testid="coverage-page" />,
}));
vi.mock("../../../src/renderer/pages/feedback-page", () => ({
  FeedbackPage: () => <div data-testid="feedback-page" />,
}));
vi.mock("../../../src/renderer/pages/feedback-history-page", () => ({
  FeedbackHistoryPage: () => <div data-testid="feedback-history-page" />,
}));
vi.mock("../../../src/renderer/pages/settings-page", () => ({
  SettingsPage: () => <div data-testid="settings-page" />,
}));
vi.mock("../../../src/renderer/pages/help-page", () => ({
  HelpPage: () => <div data-testid="help-page" />,
}));

import { App } from "../../../src/renderer/App";
import { useUiStore } from "../../../src/renderer/stores/ui-store";

const ONBOARDING_KEY = "tih-onboarding-completed";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    useUiStore.setState({ theme: "light" });
  });

  it("renders the app shell with core layout components", () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    render(<App />);

    expect(screen.getByTestId("toast")).toBeDefined();
    expect(screen.getByTestId("menu-bar")).toBeDefined();
    expect(screen.getByTestId("sidebar")).toBeDefined();
    expect(screen.getByTestId("header")).toBeDefined();
    expect(screen.getByTestId("log-panel")).toBeDefined();
    expect(screen.getByTestId("progress-bar")).toBeDefined();
  });

  it("applies the light theme class by default", () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    const { container } = render(<App />);
    const appDiv = container.firstElementChild;
    expect(appDiv?.className).toContain("light");
  });

  it("applies the dark theme class when theme is dark", () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    useUiStore.setState({ theme: "dark" });
    const { container } = render(<App />);
    const appDiv = container.firstElementChild;
    expect(appDiv?.className).toContain("dark");
  });

  it("shows onboarding wizard when onboarding is not completed", async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByTestId("onboarding-wizard")).toBeDefined();
  });

  it("does not show onboarding wizard when onboarding is already completed", () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    render(<App />);
    expect(screen.queryByTestId("onboarding-wizard")).toBeNull();
  });

  it("hides onboarding and sets localStorage when onboarding completes", async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByTestId("onboarding-wizard")).toBeDefined();

    act(() => {
      fireEvent.click(screen.getByTestId("complete-onboarding"));
    });

    expect(screen.queryByTestId("onboarding-wizard")).toBeNull();
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe("true");
  });

  it("renders the home page on the default route", () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    render(<App />);
    expect(screen.getByTestId("home-page")).toBeDefined();
  });
});
