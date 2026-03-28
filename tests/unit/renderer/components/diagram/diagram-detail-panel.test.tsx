import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../../helpers/render-with-providers";
import { DiagramDetailPanel } from "../../../../../src/renderer/components/diagram/diagram-detail-panel";
import type { ModuleCoverage } from "@shared/types/coverage";

describe("DiagramDetailPanel", () => {
  const mockOnClose = vi.fn();
  const moduleCoverage: ModuleCoverage = {
    moduleId: "src/api",
    lineCoverage: { covered: 80, total: 100, percentage: 80 },
    branchCoverage: { covered: 60, total: 100, percentage: 60 },
    functionCoverage: { covered: 90, total: 100, percentage: 90 },
    files: [
      {
        filePath: "src/api/handler.ts",
        lineCoverage: { covered: 80, total: 100, percentage: 80 },
        branchCoverage: null,
        functionCoverage: { covered: 90, total: 100, percentage: 90 },
        uncoveredLines: [],
        uncoveredFunctions: ["unusedFn"],
        coveredByTests: [],
      },
    ],
    colorLevel: "green",
  };

  it("renders module name", () => {
    renderWithProviders(
      <DiagramDetailPanel
        moduleCoverage={moduleCoverage}
        moduleName="api"
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("api/")).toBeDefined();
  });

  it("renders line coverage percentage", () => {
    renderWithProviders(
      <DiagramDetailPanel
        moduleCoverage={moduleCoverage}
        moduleName="api"
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("80.0%")).toBeDefined();
  });

  it("renders close button", () => {
    renderWithProviders(
      <DiagramDetailPanel
        moduleCoverage={moduleCoverage}
        moduleName="api"
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("✕")).toBeDefined();
  });

  it("calls onClose when close button clicked", () => {
    renderWithProviders(
      <DiagramDetailPanel
        moduleCoverage={moduleCoverage}
        moduleName="api"
        onClose={mockOnClose}
      />,
    );
    fireEvent.click(screen.getByText("✕"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders file list", () => {
    renderWithProviders(
      <DiagramDetailPanel
        moduleCoverage={moduleCoverage}
        moduleName="api"
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText(/handler\.ts/)).toBeDefined();
  });

  it("renders feedback button when coverage is below green", () => {
    const redCoverage: ModuleCoverage = {
      ...moduleCoverage,
      colorLevel: "red",
    };
    renderWithProviders(
      <DiagramDetailPanel
        moduleCoverage={redCoverage}
        moduleName="api"
        onClose={mockOnClose}
      />,
    );
    const feedbackBtn = screen.getByRole("button", { name: /フィードバック/ });
    expect(feedbackBtn).toBeDefined();
  });

  it("does not render feedback button when coverage is green", () => {
    renderWithProviders(
      <DiagramDetailPanel
        moduleCoverage={moduleCoverage}
        moduleName="api"
        onClose={mockOnClose}
      />,
    );
    expect(screen.queryByRole("button", { name: /フィードバック/ })).toBeNull();
  });
});
