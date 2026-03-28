import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../helpers/render-with-providers";
import { CoverageDetailPanel } from "../../../../src/renderer/pages/coverage-detail-panel";
import type { ModuleCoverage } from "@shared/types/coverage";

describe("CoverageDetailPanel", () => {
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
        uncoveredFunctions: [],
        coveredByTests: [],
      },
    ],
    colorLevel: "green",
  };

  it("renders nothing when moduleCoverage is null", () => {
    const { container } = renderWithProviders(
      <CoverageDetailPanel moduleCoverage={null} onClose={mockOnClose} />,
    );
    expect(container.querySelector(".detail-panel")).toBeNull();
  });

  it("renders module ID as title", () => {
    renderWithProviders(
      <CoverageDetailPanel
        moduleCoverage={moduleCoverage}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("src/api")).toBeDefined();
  });

  it("renders close button", () => {
    renderWithProviders(
      <CoverageDetailPanel
        moduleCoverage={moduleCoverage}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("✕")).toBeDefined();
  });

  it("renders coverage percentage", () => {
    renderWithProviders(
      <CoverageDetailPanel
        moduleCoverage={moduleCoverage}
        onClose={mockOnClose}
      />,
    );
    expect(screen.getByText("80.0%")).toBeDefined();
  });
});
