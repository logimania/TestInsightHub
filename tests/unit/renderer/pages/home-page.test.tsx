import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
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
});
