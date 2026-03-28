import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
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
});
