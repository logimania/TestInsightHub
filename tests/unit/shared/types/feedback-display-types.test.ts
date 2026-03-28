import { describe, it, expect } from "vitest";
import type {
  EnrichedGap,
  UncoveredBranch,
  TestScenario,
} from "../../../../src/shared/types/feedback-display";

describe("shared/types/feedback-display", () => {
  it("EnrichedGap structure has all required fields", () => {
    const gap: EnrichedGap = {
      filePath: "src/main/index.ts",
      moduleName: "src/main",
      lineCoverage: { covered: 0, total: 100, percentage: 0 },
      branchCoverage: null,
      functionCoverage: { covered: 0, total: 10, percentage: 0 },
      targetCoverage: 80,
      priority: "high",
      priorityScore: 75,
      complexity: 5,
      recommendedTestType: "integration",
      uncoveredFunctions: ["createWindow", "setupCSP"],
      uncoveredBranches: [],
      qualityLevel: "none",
      qualityScore: 0,
      qualitySuggestions: ["テストが存在しません"],
      requiredScenarios: [],
    };
    expect(gap.filePath).toBe("src/main/index.ts");
    expect(gap.priority).toBe("high");
    expect(gap.uncoveredFunctions).toHaveLength(2);
  });

  it("EnrichedGap supports branchCoverage as non-null", () => {
    const gap: EnrichedGap = {
      filePath: "src/a.ts",
      moduleName: "src",
      lineCoverage: { covered: 50, total: 100, percentage: 50 },
      branchCoverage: { covered: 3, total: 10, percentage: 30 },
      functionCoverage: { covered: 5, total: 10, percentage: 50 },
      targetCoverage: 80,
      priority: "medium",
      priorityScore: 50,
      complexity: 3,
      recommendedTestType: "unit",
      uncoveredFunctions: [],
      uncoveredBranches: [
        { line: 10, condition: "if (x > 0)", uncoveredPath: "false" },
      ],
      qualityLevel: "medium",
      qualityScore: 50,
      qualitySuggestions: [],
      requiredScenarios: [],
    };
    expect(gap.branchCoverage).not.toBeNull();
    expect(gap.branchCoverage!.percentage).toBe(30);
  });

  it("UncoveredBranch tracks uncovered condition paths", () => {
    const branches: UncoveredBranch[] = [
      { line: 5, condition: "if (a)", uncoveredPath: "true" },
      { line: 10, condition: "if (b)", uncoveredPath: "false" },
      { line: 15, condition: "switch (c)", uncoveredPath: "both" },
    ];
    expect(branches).toHaveLength(3);
    expect(branches[2].uncoveredPath).toBe("both");
  });

  it("TestScenario defines test types and assertions", () => {
    const scenarios: TestScenario[] = [
      {
        type: "normal",
        description: "正常系テスト",
        assertions: ["戻り値が正しい"],
      },
      {
        type: "error",
        description: "エラーケース",
        assertions: ["エラーが投げられる", "エラーメッセージが正しい"],
      },
      {
        type: "boundary",
        description: "境界値テスト",
        assertions: ["空配列の場合"],
      },
    ];
    expect(scenarios).toHaveLength(3);
    expect(scenarios[1].assertions).toHaveLength(2);
  });
});
