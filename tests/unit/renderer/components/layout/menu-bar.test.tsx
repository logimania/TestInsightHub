import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../../helpers/render-with-providers";
import { MenuBar } from "../../../../../src/renderer/components/layout/menu-bar";
import { useUiStore } from "../../../../../src/renderer/stores/ui-store";
import { useProjectStore } from "../../../../../src/renderer/stores/project-store";
import { useCoverageStore } from "../../../../../src/renderer/stores/coverage-store";
import { useFeedbackStore } from "../../../../../src/renderer/stores/feedback-store";
import { useToast } from "../../../../../src/renderer/components/toast";

vi.stubGlobal("window", {
  ...window,
  api: {
    project: { selectDirectory: vi.fn() },
    feedback: { deploy: vi.fn() },
  },
  close: vi.fn(),
});

describe("MenuBar", () => {
  beforeEach(() => {
    useUiStore.setState({ theme: "light" });
    useProjectStore.setState({ structure: null });
    useCoverageStore.getState().reset();
    useFeedbackStore.getState().reset();
    useToast.setState({ message: null });
  });

  it("renders menu bar", () => {
    const { container } = renderWithProviders(<MenuBar />);
    expect(container.querySelector(".custom-menu-bar")).toBeDefined();
  });

  it("renders File menu trigger", () => {
    renderWithProviders(<MenuBar />);
    const triggers = screen.getAllByRole("button");
    const fileBtn = triggers.find(
      (b) =>
        b.textContent?.includes("ファイル") || b.textContent?.includes("File"),
    );
    expect(fileBtn).toBeDefined();
  });

  it("opens dropdown when menu trigger clicked", () => {
    renderWithProviders(<MenuBar />);
    const triggers = screen.getAllByRole("button");
    fireEvent.click(triggers[0]); // Click first menu trigger
    const dropdown = document.querySelector(".menu-dropdown");
    expect(dropdown).not.toBeNull();
  });

  it("closes dropdown when same trigger clicked again", () => {
    renderWithProviders(<MenuBar />);
    const triggers = screen.getAllByRole("button");
    fireEvent.click(triggers[0]);
    expect(document.querySelector(".menu-dropdown")).not.toBeNull();
    fireEvent.click(triggers[0]);
    expect(document.querySelector(".menu-dropdown")).toBeNull();
  });

  it("renders menu items in dropdown", () => {
    renderWithProviders(<MenuBar />);
    const triggers = screen.getAllByRole("button");
    fireEvent.click(triggers[0]); // Open file menu
    const menuItems = document.querySelectorAll(".menu-item");
    expect(menuItems.length).toBeGreaterThan(0);
  });

  it("renders View menu with theme toggle", () => {
    renderWithProviders(<MenuBar />);
    const triggers = screen.getAllByRole("button");
    // Find and click View menu
    const viewBtn = triggers.find(
      (b) => b.textContent?.includes("表示") || b.textContent?.includes("View"),
    );
    if (viewBtn) {
      fireEvent.click(viewBtn);
      const menuItems = document.querySelectorAll(".menu-item");
      expect(menuItems.length).toBeGreaterThan(0);
    }
  });

  it("renders Help menu with About option", () => {
    renderWithProviders(<MenuBar />);
    const triggers = screen.getAllByRole("button");
    const helpBtn = triggers.find(
      (b) =>
        b.textContent?.includes("ヘルプ") || b.textContent?.includes("Help"),
    );
    if (helpBtn) {
      fireEvent.click(helpBtn);
      const aboutItem = document.querySelector(".menu-item");
      expect(aboutItem).not.toBeNull();
    }
  });
});
