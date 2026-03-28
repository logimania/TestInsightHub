import { describe, it, expect } from "vitest";
import type {
  FeedbackFile,
  QualityGate,
  ModuleGateResult,
  FeedbackSummary,
  CoverageGap,
  TestRecommendation,
  FeedbackComparison,
  GapChange,
  PriorityWeights,
} from "../../../../src/shared/types/feedback";

describe("shared/types/feedback", () => {
  it("FeedbackFile structure is valid", () => {
    const feedback: FeedbackFile = {
      version: "1.3.0",
      generatedAt: "2026-01-01T00:00:00Z",
      projectRoot: "/project",
      coverageThreshold: 80,
      qualityGate: {
        passed: true,
        verdict: "合格",
        moduleResults: [],
        failedModules: [],
      },
      summary: {
        totalModules: 4,
        belowThreshold: 0,
        totalUncoveredFunctions: 0,
        overallCoverage: 86.4,
      },
      gaps: [],
      recommendations: [],
    };
    expect(feedback.version).toBe("1.3.0");
    expect(feedback.qualityGate.passed).toBe(true);
  });

  it("QualityGate tracks pass/fail with module details", () => {
    const gate: QualityGate = {
      passed: false,
      verdict: "不合格",
      moduleResults: [
        {
          moduleId: "src/main",
          coverage: 50,
          threshold: 80,
          passed: false,
          fileCount: 10,
          untestedFileCount: 5,
        },
      ],
      failedModules: ["src/main"],
    };
    expect(gate.failedModules).toContain("src/main");
  });

  it("CoverageGap tracks file-level coverage details", () => {
    const gap: CoverageGap = {
      filePath: "src/main/index.ts",
      moduleName: "src/main",
      currentCoverage: 0,
      targetCoverage: 80,
      uncoveredLines: [{ start: 1, end: 10, functionName: "createWindow" }],
      recommendedTestType: "integration",
      priority: "medium",
      priorityScore: 41,
      complexity: 3,
      changeFrequency: 0,
    };
    expect(gap.currentCoverage).toBe(0);
    expect(gap.priority).toBe("medium");
  });

  it("TestRecommendation holds suggestion details", () => {
    const rec: TestRecommendation = {
      type: "unit",
      targetFile: "src/utils.ts",
      suggestedTestFile: "tests/utils.test.ts",
      functions: ["calculateScore"],
      description: "Add unit tests for calculateScore",
    };
    expect(rec.functions).toContain("calculateScore");
  });

  it("FeedbackComparison tracks improvement over time", () => {
    const comparison: FeedbackComparison = {
      previousFeedbackAt: "2026-01-01",
      currentFeedbackAt: "2026-03-01",
      improved: [
        {
          filePath: "src/a.ts",
          previousCoverage: 40,
          currentCoverage: 85,
          targetCoverage: 80,
        },
      ],
      unchanged: [],
      newGaps: [],
      improvementRate: 100,
    };
    expect(comparison.improvementRate).toBe(100);
  });

  it("PriorityWeights sum to 1.0 in default usage", () => {
    const weights: PriorityWeights = {
      coverageGapWeight: 0.4,
      complexityWeight: 0.3,
      changeFreqWeight: 0.3,
    };
    const sum =
      weights.coverageGapWeight +
      weights.complexityWeight +
      weights.changeFreqWeight;
    expect(sum).toBeCloseTo(1.0);
  });
});
