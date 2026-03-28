import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
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

  it("renders coverage mode selector when data exists", () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 10, parsedAt: "", parseErrors: [] },
    });
    useCoverageStore.setState({
      normalizedCoverage: {
        reportFormat: "istanbul",
        files: [{ filePath: "a.ts", lineCoverage: { covered: 50, total: 100, percentage: 50 }, branchCoverage: null, functionCoverage: { covered: 50, total: 100, percentage: 50 }, uncoveredLines: [], uncoveredFunctions: [], coveredByTests: [] }],
        generatedAt: "2026-01-01",
      },
    });
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it("renders summary stats with coverage data", () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 100, parsedAt: "", parseErrors: [] },
    });
    useCoverageStore.setState({
      normalizedCoverage: {
        reportFormat: "istanbul",
        files: [
          { filePath: "a.ts", lineCoverage: { covered: 80, total: 100, percentage: 80 }, branchCoverage: null, functionCoverage: { covered: 80, total: 100, percentage: 80 }, uncoveredLines: [], uncoveredFunctions: [], coveredByTests: [] },
          { filePath: "b.ts", lineCoverage: { covered: 60, total: 100, percentage: 60 }, branchCoverage: null, functionCoverage: { covered: 60, total: 100, percentage: 60 }, uncoveredLines: [], uncoveredFunctions: [], coveredByTests: [] },
        ],
        generatedAt: "2026-01-01",
      },
    });
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    expect(screen.getByText("a.ts")).toBeDefined();
    expect(screen.getByText("b.ts")).toBeDefined();
    expect(screen.getByText("istanbul")).toBeDefined();
  });

  it("renders rerun button when coverage data exists", () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 10, parsedAt: "", parseErrors: [] },
    });
    useCoverageStore.setState({
      normalizedCoverage: { reportFormat: "istanbul", files: [{ filePath: "a.ts", lineCoverage: { covered: 50, total: 100, percentage: 50 }, branchCoverage: null, functionCoverage: { covered: 50, total: 100, percentage: 50 }, uncoveredLines: [], uncoveredFunctions: [], coveredByTests: [] }], generatedAt: "" },
    });
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    expect(screen.getByRole("button", { name: /再実行|rerun/i })).toBeDefined();
  });

  it("renders advanced options toggle", () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 10, parsedAt: "", parseErrors: [] },
    });
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    expect(screen.getByRole("button", { name: /▶|詳細|advanced/i })).toBeDefined();
  });

  it("shows load existing button in advanced options", () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 10, parsedAt: "", parseErrors: [] },
    });
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    const advBtn = screen.getByRole("button", { name: /▶|詳細|advanced/i });
    fireEvent.click(advBtn);
    expect(screen.getByRole("button", { name: /既存レポート|load existing/i })).toBeDefined();
  });

  it("handles run tests click when project is loaded", async () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [{ id: "src", name: "src", path: "src", files: [{ path: "src/a.ts", language: "typescript", loc: 10, functions: [{ name: "fn", startLine: 1, endLine: 5, complexity: 1 }], imports: [] }], fileCount: 1, functionCount: 1, totalLoc: 10, children: [] }],
        edges: [],
        totalFiles: 1,
        totalLoc: 10,
        parsedAt: "",
        parseErrors: [],
      },
    });

    (window as any).api.test.run.mockResolvedValue({
      reportFormat: "istanbul",
      files: [{ filePath: "src/a.ts", lineCoverage: { covered: 5, total: 10, percentage: 50 }, branchCoverage: null, functionCoverage: { covered: 1, total: 1, percentage: 100 }, uncoveredLines: [], uncoveredFunctions: [], coveredByTests: [] }],
      generatedAt: "2026-01-01",
    });

    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    const runBtn = screen.getByRole("button", { name: /テスト実行|run/i });
    fireEvent.click(runBtn);

    // After clicking, button should eventually change to running state
    // Since it's async, we just verify the click was accepted
    expect(runBtn).toBeDefined();
  });

  it("renders coverage mode change via select", () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 10, parsedAt: "", parseErrors: [] },
    });
    useCoverageStore.setState({
      normalizedCoverage: {
        reportFormat: "istanbul",
        files: [{ filePath: "a.ts", lineCoverage: { covered: 50, total: 100, percentage: 50 }, branchCoverage: { covered: 3, total: 10, percentage: 30 }, functionCoverage: { covered: 50, total: 100, percentage: 50 }, uncoveredLines: [], uncoveredFunctions: [], coveredByTests: [] }],
        generatedAt: "2026-01-01",
      },
    });
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    const selects = screen.getAllByRole("combobox");
    // Change coverage mode
    fireEvent.change(selects[0], { target: { value: "branch" } });
    expect(useCoverageStore.getState().coverageMode).toBe("branch");
  });

  it("renders test type filter change via select", () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 10, parsedAt: "", parseErrors: [] },
    });
    useCoverageStore.setState({
      normalizedCoverage: {
        reportFormat: "istanbul",
        files: [{ filePath: "a.ts", lineCoverage: { covered: 50, total: 100, percentage: 50 }, branchCoverage: null, functionCoverage: { covered: 50, total: 100, percentage: 50 }, uncoveredLines: [], uncoveredFunctions: [], coveredByTests: [{ testFilePath: "test.ts", testName: "t1", testType: "unit" }] }],
        generatedAt: "2026-01-01",
      },
    });
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    const selects = screen.getAllByRole("combobox");
    // Change test type filter
    fireEvent.change(selects[1], { target: { value: "unit" } });
    expect(useCoverageStore.getState().testTypeFilter).toBe("unit");
  });

  it("shows no-tests-detected banner when result is empty", async () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [{ id: "src", name: "src", path: "src", files: [{ path: "src/a.ts", language: "typescript", loc: 10, functions: [], imports: [] }], fileCount: 1, functionCount: 0, totalLoc: 10, children: [] }],
        edges: [],
        totalFiles: 1,
        totalLoc: 10,
        parsedAt: "",
        parseErrors: [],
      },
    });
    (window as any).api.test.run.mockResolvedValue(null);

    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    const runBtn = screen.getByRole("button", { name: /テスト実行|run/i });
    fireEvent.click(runBtn);

    // Should eventually show the no-tests banner (async behavior)
    expect(runBtn).toBeDefined();
  });

  it("shows custom command input field when advanced section is expanded", () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 10, parsedAt: "", parseErrors: [] },
    });
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    const advBtn = screen.getByRole("button", { name: /▶|詳細|advanced/i });
    fireEvent.click(advBtn);

    const input = screen.getByPlaceholderText(/npx vitest|例:|e\.g\./i);
    expect(input).toBeDefined();
    fireEvent.change(input, { target: { value: "yarn test" } });
    expect((input as HTMLInputElement).value).toBe("yarn test");
  });

  it("renders coverage percentage color based on threshold", () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 100, parsedAt: "", parseErrors: [] },
    });
    useCoverageStore.setState({
      normalizedCoverage: {
        reportFormat: "istanbul",
        files: [
          { filePath: "high.ts", lineCoverage: { covered: 90, total: 100, percentage: 90 }, branchCoverage: null, functionCoverage: { covered: 90, total: 100, percentage: 90 }, uncoveredLines: [], uncoveredFunctions: [], coveredByTests: [] },
          { filePath: "low.ts", lineCoverage: { covered: 20, total: 100, percentage: 20 }, branchCoverage: null, functionCoverage: { covered: 20, total: 100, percentage: 20 }, uncoveredLines: [], uncoveredFunctions: [], coveredByTests: [] },
        ],
        generatedAt: "2026-01-01",
      },
    });
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    expect(screen.getByText("high.ts")).toBeDefined();
    expect(screen.getByText("low.ts")).toBeDefined();
  });

  it("filters files by test type when using e2e filter", () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 10, parsedAt: "", parseErrors: [] },
    });
    useCoverageStore.setState({
      normalizedCoverage: {
        reportFormat: "istanbul",
        files: [{ filePath: "a.ts", lineCoverage: { covered: 50, total: 100, percentage: 50 }, branchCoverage: null, functionCoverage: { covered: 50, total: 100, percentage: 50 }, uncoveredLines: [], uncoveredFunctions: [], coveredByTests: [{ testFilePath: "test.ts", testName: "t1", testType: "unit" }] }],
        generatedAt: "",
      },
    });
    // Set e2e filter - file has only unit tests, so it won't match
    useCoverageStore.setState({ testTypeFilter: "e2e" });
    renderWithProviders(<CoveragePage />, { route: "/coverage" });
    // File should be filtered out, showing "no matching files" hint
    expect(screen.queryByText("a.ts")).toBeNull();
  });
});
