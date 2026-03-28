import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../../helpers/render-with-providers";
import { Header } from "../../../../../src/renderer/components/layout/header";
import { useUiStore } from "../../../../../src/renderer/stores/ui-store";
import { useProjectStore } from "../../../../../src/renderer/stores/project-store";

describe("Header", () => {
  beforeEach(() => {
    useUiStore.setState({ theme: "light", isLogPanelOpen: false });
    useProjectStore.setState({ structure: null });
  });

  it("renders header element", () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole("banner")).toBeDefined();
  });

  it("renders theme toggle button", () => {
    renderWithProviders(<Header />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("toggles theme on click", () => {
    renderWithProviders(<Header />);
    const themeBtn = screen.getByText("🌙");
    fireEvent.click(themeBtn);
    expect(useUiStore.getState().theme).toBe("dark");
  });

  it("shows project path when structure loaded", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/my/project",
        modules: [],
        edges: [],
        totalFiles: 1,
        totalLoc: 10,
        parsedAt: "",
        parseErrors: [],
      },
    });
    renderWithProviders(<Header />);
    expect(screen.getByText("/my/project")).toBeDefined();
  });

  it("does not show project path when no structure", () => {
    renderWithProviders(<Header />);
    expect(screen.queryByText("/my/project")).toBeNull();
  });
});
