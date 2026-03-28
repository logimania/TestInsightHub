import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../helpers/render-with-providers";
import { FeedbackPage } from "../../../../src/renderer/pages/feedback-page";
import { useProjectStore } from "../../../../src/renderer/stores/project-store";
import { useCoverageStore } from "../../../../src/renderer/stores/coverage-store";
import { useFeedbackStore } from "../../../../src/renderer/stores/feedback-store";
import { useToast } from "../../../../src/renderer/components/toast";

vi.stubGlobal("window", {
  api: {
    feedback: { deploy: vi.fn().mockResolvedValue({ success: true }) },
  },
});

Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

describe("FeedbackPage", () => {
  beforeEach(() => {
    useProjectStore.setState({ structure: null, isLoading: false });
    useCoverageStore.getState().reset();
    useFeedbackStore.getState().reset();
    useToast.setState({ message: null, type: "success" });
  });

  it("renders page title", () => {
    renderWithProviders(<FeedbackPage />, { route: "/feedback" });
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
  });

  it("shows hint box when no project loaded", () => {
    renderWithProviders(<FeedbackPage />, { route: "/feedback" });
    // Should contain a hint about loading project
    const hint = screen.getByText(/プロジェクトを読み込んで/);
    expect(hint).toBeDefined();
  });

  it("renders generate button", () => {
    renderWithProviders(<FeedbackPage />, { route: "/feedback" });
    const btn = screen.getByRole("button", { name: /フィードバック生成/ });
    expect(btn).toBeDefined();
  });

  it("disables generate when no data", () => {
    renderWithProviders(<FeedbackPage />, { route: "/feedback" });
    const btn = screen.getByRole("button", { name: /フィードバック生成/ });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("renders threshold input", () => {
    renderWithProviders(<FeedbackPage />, { route: "/feedback" });
    const input = screen.getByRole("spinbutton");
    expect(input).toBeDefined();
  });

  it("renders enriched gaps when feedback is generated", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [
          {
            id: "src",
            name: "src",
            path: "src",
            files: [
              {
                path: "src/a.ts",
                language: "typescript",
                loc: 100,
                functions: [
                  { name: "fn1", startLine: 1, endLine: 10, complexity: 5 },
                ],
                imports: [],
              },
            ],
            fileCount: 1,
            functionCount: 1,
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
      moduleCoverages: [
        {
          moduleId: "src",
          lineCoverage: { covered: 20, total: 100, percentage: 20 },
          branchCoverage: null,
          functionCoverage: { covered: 20, total: 100, percentage: 20 },
          files: [
            {
              filePath: "src/a.ts",
              lineCoverage: { covered: 20, total: 100, percentage: 20 },
              branchCoverage: null,
              functionCoverage: { covered: 20, total: 100, percentage: 20 },
              uncoveredLines: [{ start: 1, end: 10 }],
              uncoveredFunctions: ["fn1"],
              coveredByTests: [],
            },
          ],
          colorLevel: "red",
        },
      ],
    });
    useFeedbackStore.setState({
      currentFeedback: {
        version: "1.1.0",
        generatedAt: "2026-01-01T00:00:00Z",
        projectRoot: "/p",
        coverageThreshold: 80,
        summary: {
          totalModules: 1,
          belowThreshold: 1,
          totalUncoveredFunctions: 1,
          overallCoverage: 20,
        },
        gaps: [
          {
            filePath: "src/a.ts",
            moduleName: "src",
            currentCoverage: 20,
            targetCoverage: 80,
            uncoveredLines: [{ start: 1, end: 10, functionName: "fn1" }],
            recommendedTestType: "unit",
            priority: "high",
            priorityScore: 75,
            complexity: 5,
            changeFrequency: 0,
          },
        ],
        recommendations: [],
      },
      enrichedGaps: [
        {
          filePath: "src/a.ts",
          moduleName: "src",
          lineCoverage: { covered: 20, total: 100, percentage: 20 },
          branchCoverage: null,
          functionCoverage: { covered: 20, total: 100, percentage: 20 },
          targetCoverage: 80,
          priority: "high",
          priorityScore: 75,
          complexity: 5,
          recommendedTestType: "unit",
          uncoveredFunctions: ["fn1"],
          uncoveredBranches: [
            { line: 5, condition: "if check", uncoveredPath: "both" as const },
          ],
          qualityLevel: "none",
          qualityScore: 0,
          qualitySuggestions: ["テストが存在しません"],
          requiredScenarios: [
            {
              type: "normal",
              description: "fn1 の正常系テスト",
              assertions: ["戻り値が正しい"],
            },
            {
              type: "error",
              description: "エラーケース",
              assertions: ["エラーが投げられる"],
            },
          ],
        },
      ],
    });

    renderWithProviders(<FeedbackPage />, { route: "/feedback" });

    // Should show result section
    expect(screen.getByText(/src\/a\.ts/)).toBeDefined();
    expect(screen.getByText(/HIGH/)).toBeDefined();
    expect(screen.getAllByText(/fn1/).length).toBeGreaterThan(0);
    expect(screen.getByText(/テストが存在しません/)).toBeDefined();
    // Copy and deploy buttons should appear
    expect(screen.getByRole("button", { name: /コピー/ })).toBeDefined();
    expect(
      screen.getByRole("button", { name: /プロジェクトに配置/ }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /クリア/ })).toBeDefined();
  });

  it("shows coverage hint when project loaded but no coverage", () => {
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
    renderWithProviders(<FeedbackPage />, { route: "/feedback" });
    expect(screen.getByText(/カバレッジ画面でテスト/)).toBeDefined();
  });

  it("handles generate click with project and coverage data", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [{ id: "src", name: "src", path: "src", files: [{ path: "src/a.ts", language: "typescript", loc: 100, functions: [{ name: "fn1", startLine: 1, endLine: 10, complexity: 5 }], imports: [] }], fileCount: 1, functionCount: 1, totalLoc: 100, children: [] }],
        edges: [],
        totalFiles: 1,
        totalLoc: 100,
        parsedAt: "",
        parseErrors: [],
      },
    });
    useCoverageStore.setState({
      moduleCoverages: [{ moduleId: "src", lineCoverage: { covered: 20, total: 100, percentage: 20 }, branchCoverage: null, functionCoverage: { covered: 20, total: 100, percentage: 20 }, files: [{ filePath: "src/a.ts", lineCoverage: { covered: 20, total: 100, percentage: 20 }, branchCoverage: null, functionCoverage: { covered: 20, total: 100, percentage: 20 }, uncoveredLines: [{ start: 1, end: 10 }], uncoveredFunctions: ["fn1"], coveredByTests: [] }], colorLevel: "red" }],
    });

    renderWithProviders(<FeedbackPage />, { route: "/feedback" });
    const btn = screen.getByRole("button", { name: /フィードバック生成/ });
    expect(btn.hasAttribute("disabled")).toBe(false);
    fireEvent.click(btn);
    // Should trigger generation without errors
    expect(btn).toBeDefined();
  });

  it("handles threshold input change", () => {
    renderWithProviders(<FeedbackPage />, { route: "/feedback" });
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "70" } });
    expect((input as HTMLInputElement).value).toBe("70");
  });

  it("handles clear button click when feedback exists", () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 10, parsedAt: "", parseErrors: [] },
    });
    useFeedbackStore.setState({
      currentFeedback: {
        version: "1.1.0",
        generatedAt: "2026-01-01T00:00:00Z",
        projectRoot: "/p",
        coverageThreshold: 80,
        summary: { totalModules: 1, belowThreshold: 0, totalUncoveredFunctions: 0, overallCoverage: 90 },
        gaps: [],
        recommendations: [],
      },
      enrichedGaps: [],
    });

    renderWithProviders(<FeedbackPage />, { route: "/feedback" });
    const clearBtn = screen.getByRole("button", { name: /クリア/ });
    fireEvent.click(clearBtn);

    // After clearing, feedback should be reset
    expect(useFeedbackStore.getState().currentFeedback).toBeNull();
  });

  it("handles copy to clipboard click", async () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 10, parsedAt: "", parseErrors: [] },
    });
    useFeedbackStore.setState({
      currentFeedback: {
        version: "1.1.0",
        generatedAt: "2026-01-01T00:00:00Z",
        projectRoot: "/p",
        coverageThreshold: 80,
        summary: { totalModules: 1, belowThreshold: 0, totalUncoveredFunctions: 0, overallCoverage: 90 },
        gaps: [],
        recommendations: [],
      },
      enrichedGaps: [],
    });

    renderWithProviders(<FeedbackPage />, { route: "/feedback" });
    const copyBtn = screen.getByRole("button", { name: /コピー/ });
    fireEvent.click(copyBtn);

    // clipboard.writeText should have been called
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it("handles deploy button click", async () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 10, parsedAt: "", parseErrors: [] },
    });
    useFeedbackStore.setState({
      currentFeedback: {
        version: "1.1.0",
        generatedAt: "2026-01-01T00:00:00Z",
        projectRoot: "/p",
        coverageThreshold: 80,
        summary: { totalModules: 1, belowThreshold: 0, totalUncoveredFunctions: 0, overallCoverage: 90 },
        gaps: [],
        recommendations: [],
      },
      enrichedGaps: [],
    });

    renderWithProviders(<FeedbackPage />, { route: "/feedback" });
    const deployBtn = screen.getByRole("button", { name: /プロジェクトに配置/ });
    fireEvent.click(deployBtn);

    expect((window as any).api.feedback.deploy).toHaveBeenCalled();
  });

  it("renders view history link", () => {
    renderWithProviders(<FeedbackPage />, { route: "/feedback" });
    const historyLink = screen.getByRole("button", { name: /履歴|history/i });
    expect(historyLink).toBeDefined();
  });

  it("shows enriched gap with branch coverage when present", () => {
    useProjectStore.setState({
      structure: { rootPath: "/p", modules: [], edges: [], totalFiles: 1, totalLoc: 100, parsedAt: "", parseErrors: [] },
    });
    useFeedbackStore.setState({
      currentFeedback: {
        version: "1.1.0",
        generatedAt: "2026-01-01T00:00:00Z",
        projectRoot: "/p",
        coverageThreshold: 80,
        summary: { totalModules: 1, belowThreshold: 1, totalUncoveredFunctions: 0, overallCoverage: 50 },
        gaps: [],
        recommendations: [],
      },
      enrichedGaps: [{
        filePath: "src/b.ts",
        moduleName: "src",
        lineCoverage: { covered: 50, total: 100, percentage: 50 },
        branchCoverage: { covered: 2, total: 10, percentage: 20 },
        functionCoverage: { covered: 5, total: 10, percentage: 50 },
        targetCoverage: 80,
        priority: "medium",
        priorityScore: 50,
        complexity: 5,
        recommendedTestType: "unit",
        uncoveredFunctions: [],
        uncoveredBranches: [],
        qualityLevel: "medium",
        qualityScore: 50,
        qualitySuggestions: [],
        requiredScenarios: [],
      }],
    });

    renderWithProviders(<FeedbackPage />, { route: "/feedback" });
    expect(screen.getByText(/src\/b\.ts/)).toBeDefined();
    expect(screen.getByText("Branch")).toBeDefined();
  });
});
