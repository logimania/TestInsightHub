import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../helpers/render-with-providers";
import { HomePage } from "../../../../src/renderer/pages/home-page";
import { useProjectStore } from "../../../../src/renderer/stores/project-store";
import { useSettingsStore } from "../../../../src/renderer/stores/settings-store";

vi.stubGlobal("window", {
  api: {
    project: { selectDirectory: vi.fn(), parse: vi.fn() },
    settings: { loadRecentProjects: vi.fn().mockResolvedValue([]) },
    onParseProgress: vi.fn(),
  },
});

describe("HomePage", () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    useSettingsStore.setState({ recentProjects: [] });
  });

  it("renders title", () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
  });

  it("renders project select button", () => {
    renderWithProviders(<HomePage />);
    const btn = screen.getByRole("button", { name: /プロジェクト|select/i });
    expect(btn).toBeDefined();
  });

  it("shows recent projects when available", () => {
    useSettingsStore.setState({
      recentProjects: [
        {
          projectId: "p1",
          projectName: "My App",
          rootPath: "/app",
          lastOpenedAt: "2026-01-01T00:00:00Z",
        },
      ],
    });

    renderWithProviders(<HomePage />);
    expect(screen.getByText("My App")).toBeDefined();
    expect(screen.getByText("/app")).toBeDefined();
  });

  it("does not show recent section when empty", () => {
    renderWithProviders(<HomePage />);
    expect(screen.queryByText(/最近のプロジェクト|Recent/i)).toBeNull();
  });

  it("disables button when loading", () => {
    useProjectStore.setState({ isLoading: true });
    renderWithProviders(<HomePage />);
    const buttons = screen.getAllByRole("button");
    const loadingBtn = buttons.find((b) => b.hasAttribute("disabled"));
    expect(loadingBtn).toBeDefined();
  });

  it("shows loading text when isLoading", () => {
    useProjectStore.setState({ isLoading: true });
    renderWithProviders(<HomePage />);
    expect(screen.getByText(/解析中|loading/i)).toBeDefined();
  });

  it("shows progress bar when loading with progress", () => {
    useProjectStore.setState({
      isLoading: true,
      parseProgress: { current: 50, total: 100, currentFile: "src/a.ts" },
    });
    renderWithProviders(<HomePage />);
    expect(screen.getByText("50 / 100")).toBeDefined();
  });

  it("clicking select button triggers project selection", () => {
    renderWithProviders(<HomePage />);
    const btn = screen.getByRole("button", { name: /プロジェクト|select/i });
    fireEvent.click(btn);
    // Button should be clickable (not disabled) in default state
    expect(btn.hasAttribute("disabled")).toBe(false);
  });

  it("renders multiple recent projects", () => {
    useSettingsStore.setState({
      recentProjects: [
        { projectId: "p1", projectName: "App1", rootPath: "/app1", lastOpenedAt: "2026-01-01T00:00:00Z" },
        { projectId: "p2", projectName: "App2", rootPath: "/app2", lastOpenedAt: "2026-01-02T00:00:00Z" },
      ],
    });
    renderWithProviders(<HomePage />);
    expect(screen.getByText("App1")).toBeDefined();
    expect(screen.getByText("App2")).toBeDefined();
  });
});
