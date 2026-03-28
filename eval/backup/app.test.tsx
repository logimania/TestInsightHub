import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all child components to isolate App logic
vi.mock("../../../src/renderer/components/layout/menu-bar", () => ({
  MenuBar: () => <div data-testid="menu-bar">MenuBar</div>,
}));

vi.mock("../../../src/renderer/components/layout/sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock("../../../src/renderer/components/layout/header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock("../../../src/renderer/components/toast", () => ({
  Toast: () => <div data-testid="toast">Toast</div>,
}));

vi.mock("../../../src/renderer/components/progress-bar-global", () => ({
  ProgressBarGlobal: () => <div data-testid="progress-bar">ProgressBar</div>,
}));

vi.mock("../../../src/renderer/components/layout/log-panel", () => ({
  LogPanel: () => <div data-testid="log-panel">LogPanel</div>,
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
  HomePage: () => <div data-testid="home-page">HomePage</div>,
}));

vi.mock("../../../src/renderer/pages/diagram-page", () => ({
  DiagramPage: () => <div data-testid="diagram-page">DiagramPage</div>,
}));

vi.mock("../../../src/renderer/pages/coverage-page", () => ({
  CoveragePage: () => <div data-testid="coverage-page">CoveragePage</div>,
}));

vi.mock("../../../src/renderer/pages/feedback-page", () => ({
  FeedbackPage: () => <div data-testid="feedback-page">FeedbackPage</div>,
}));

vi.mock("../../../src/renderer/pages/feedback-history-page", () => ({
  FeedbackHistoryPage: () => <div data-testid="feedback-history-page">FeedbackHistoryPage</div>,
}));

vi.mock("../../../src/renderer/pages/settings-page", () => ({
  SettingsPage: () => <div data-testid="settings-page">SettingsPage</div>,
}));

vi.mock("../../../src/renderer/pages/help-page", () => ({
  HelpPage: () => <div data-testid="help-page">HelpPage</div>,
}));

vi.mock("../../../src/renderer/components/keyboard-shortcut-provider", () => ({
  KeyboardShortcutProvider: () => null,
}));

const mockUseUiStore = vi.fn();
vi.mock("../../../src/renderer/stores/ui-store", () => ({
  useUiStore: (selector: (state: { theme: string }) => string) =>
    selector({ theme: mockUseUiStore() }),
}));

import { App } from "../../../src/renderer/App";

const ONBOARDING_KEY = "tih-onboarding-completed";

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseUiStore.mockReturnValue("light");
  });

  it("renders the app with light theme class", () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    const { container } = render(<App />);
    const appDiv = container.firstChild as HTMLElement;
    expect(appDiv.className).toContain("app");
    expect(appDiv.className).toContain("light");
  });

  it("renders the app with dark theme class", () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    mockUseUiStore.mockReturnValue("dark");
    const { container } = render(<App />);
    const appDiv = container.firstChild as HTMLElement;
    expect(appDiv.className).toContain("dark");
  });

  it("shows onboarding wizard when onboarding not completed", () => {
    render(<App />);
    expect(screen.getByTestId("onboarding-wizard")).toBeDefined();
  });

  it("does not show onboarding wizard when already completed", () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    render(<App />);
    expect(screen.queryByTestId("onboarding-wizard")).toBeNull();
  });

  it("hides onboarding wizard after completion and sets localStorage", () => {
    render(<App />);
    expect(screen.getByTestId("onboarding-wizard")).toBeDefined();

    act(() => {
      fireEvent.click(screen.getByTestId("complete-onboarding"));
    });

    expect(screen.queryByTestId("onboarding-wizard")).toBeNull();
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe("true");
  });

  it("renders core layout components", () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    render(<App />);

    expect(screen.getByTestId("toast")).toBeDefined();
    expect(screen.getByTestId("menu-bar")).toBeDefined();
    expect(screen.getByTestId("sidebar")).toBeDefined();
    expect(screen.getByTestId("header")).toBeDefined();
    expect(screen.getByTestId("log-panel")).toBeDefined();
    expect(screen.getByTestId("progress-bar")).toBeDefined();
  });

  it("renders home page on root route", () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    render(<App />);
    expect(screen.getByTestId("home-page")).toBeDefined();
  });
});
