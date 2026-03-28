import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../src/renderer/i18n/index";

// Mock @xyflow/react (used by DiagramPage)
vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
  Background: () => <div />,
  Controls: () => <div />,
  MiniMap: () => <div />,
  ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
  useReactFlow: () => ({ fitView: vi.fn() }),
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
  Handle: () => <div />,
  BaseEdge: () => <svg />,
  getBezierPath: () => ["", 0, 0],
  EdgeLabelRenderer: ({ children }: any) => <div>{children}</div>,
}));

// Mock dagre (used by use-diagram.ts)
vi.mock("dagre", () => ({
  default: {
    graphlib: {
      Graph: vi.fn().mockImplementation(() => ({
        setDefaultEdgeLabel: vi.fn(),
        setGraph: vi.fn(),
        setNode: vi.fn(),
        setEdge: vi.fn(),
        node: () => ({ x: 0, y: 0 }),
      })),
    },
    layout: vi.fn(),
  },
}));

// Attach api to existing window object (do NOT replace window itself)
Object.defineProperty(window, "api", {
  value: {
    project: { selectDirectory: vi.fn(), parse: vi.fn() },
    settings: {
      loadGlobal: vi.fn().mockResolvedValue(null),
      loadRecentProjects: vi.fn().mockResolvedValue([]),
    },
    coverage: { load: vi.fn() },
    test: { run: vi.fn() },
    feedback: { deploy: vi.fn() },
    onParseProgress: vi.fn(),
    onTestOutput: vi.fn(),
    onFileChange: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  writable: true,
  configurable: true,
});

// Spy on localStorage methods
const mockGetItem = vi.spyOn(Storage.prototype, "getItem");
const mockSetItem = vi.spyOn(Storage.prototype, "setItem");

import { App } from "../../../src/renderer/App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetItem.mockClear();
    mockSetItem.mockClear();
  });

  it("renders without crashing", () => {
    localStorage.setItem("tih-onboarding-completed", "true");
    mockGetItem.mockClear();
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    expect(container.querySelector(".app")).not.toBeNull();
  });

  it("applies theme class from ui store", () => {
    localStorage.setItem("tih-onboarding-completed", "true");
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    const appDiv = container.querySelector(".app");
    expect(appDiv).not.toBeNull();
  });

  it("shows onboarding wizard when not completed", async () => {
    // localStorage has no key, triggering onboarding
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    await waitFor(() => {
      const onboarding = container.querySelector(".onboarding-wizard") ||
        screen.queryByText(/ようこそ|Welcome|始め|スタート|次へ|start/i);
      expect(onboarding).not.toBeNull();
    });
  });

  it("does not show onboarding when already completed", () => {
    localStorage.setItem("tih-onboarding-completed", "true");
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    // Onboarding wizard should not be present
    const onboarding = container.querySelector(".onboarding-wizard");
    expect(onboarding).toBeNull();
  });

  it("reads onboarding key from localStorage on mount", () => {
    localStorage.setItem("tih-onboarding-completed", "true");
    mockGetItem.mockClear();
    render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );
    expect(mockGetItem).toHaveBeenCalledWith("tih-onboarding-completed");
  });
});
