import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../helpers/render-with-providers";
import { CoveragePage } from "../../../../src/renderer/pages/coverage-page";
import { useProjectStore } from "../../../../src/renderer/stores/project-store";
import { useCoverageStore } from "../../../../src/renderer/stores/coverage-store";
import { useToast } from "../../../../src/renderer/components/toast";

vi.stubGlobal("window", {
  api: {
    coverage: {
      load: vi
        .fn()
        .mockResolvedValue({
          reportFormat: "istanbul",
          files: [],
          generatedAt: "",
        }),
    },
    test: { run: vi.fn().mockResolvedValue(null) },
    onTestOutput: vi.fn(),
    removeAllListeners: vi.fn(),
  },
});

describe("CoveragePage", () => {
  beforeEach(() => {
    useProjectStore.setState({ structure: null });
    useCoverageStore.getState().reset();
    useToast.setState({ message: null });
  });

  it("renders page title", () => {
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
  });

  it("shows hint when no project loaded", () => {
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    expect(screen.getByText(/プロジェクト|読み込んで/)).toBeDefined();
  });

  it("renders coverage mode buttons when project loaded", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [
          {
            id: "src",
            name: "src",
            path: "src",
            files: [],
            fileCount: 0,
            functionCount: 0,
            totalLoc: 0,
            children: [],
          },
        ],
        edges: [],
        totalFiles: 1,
        totalLoc: 10,
        parsedAt: "",
        parseErrors: [],
      },
    });
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders file list when coverage data exists", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [
          {
            id: "src",
            name: "src",
            path: "src",
            files: [],
            fileCount: 1,
            functionCount: 0,
            totalLoc: 100,
            children: [],
          },
        ],
        edges: [],
        totalFiles: 1,
        totalLoc: 100,
        parsedAt: "",
        parseErrors: [],
      },
    });
    useCoverageStore.setState({
      normalizedCoverage: {
        reportFormat: "istanbul",
        files: [
          {
            filePath: "src/handler.ts",
            lineCoverage: { covered: 80, total: 100, percentage: 80 },
            branchCoverage: null,
            functionCoverage: { covered: 90, total: 100, percentage: 90 },
            uncoveredLines: [],
            uncoveredFunctions: [],
            coveredByTests: [],
          },
        ],
        generatedAt: "2026-01-01",
      },
    });
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    expect(screen.getByText(/handler\.ts/)).toBeDefined();
  });

  it("renders test run button when project loaded", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [],
        edges: [],
        totalFiles: 1,
        totalLoc: 10,
        parsedAt: "",
        parseErrors: [],
      },
    });
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    const runBtn = screen.getByRole("button", { name: /テスト実行|run/i });
    expect(runBtn).toBeDefined();
  });
});
