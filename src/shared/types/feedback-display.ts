import type { CoverageMetric, TestType } from "./coverage";
import type { TestPrerequisites } from "./feedback";

/** フィードバック画面表示用の拡張ギャップ情報 */
export interface EnrichedGap {
  readonly filePath: string;
  readonly moduleName: string;
  readonly lineCoverage: CoverageMetric;
  readonly branchCoverage: CoverageMetric | null;
  readonly functionCoverage: CoverageMetric;
  readonly targetCoverage: number;
  readonly priority: "high" | "medium" | "low";
  readonly priorityScore: number;
  readonly complexity: number;
  readonly recommendedTestType: TestType;
  readonly uncoveredFunctions: readonly string[];
  readonly uncoveredBranches: readonly UncoveredBranch[];
  readonly qualityLevel: "high" | "medium" | "low" | "none";
  readonly qualityScore: number;
  readonly qualitySuggestions: readonly string[];
  readonly requiredScenarios: readonly TestScenario[];
  readonly prerequisites?: TestPrerequisites;
}

export interface UncoveredBranch {
  readonly line: number;
  readonly condition: string;
  readonly uncoveredPath: "true" | "false" | "both";
}

export interface TestScenario {
  readonly type: "normal" | "error" | "boundary";
  readonly description: string;
  readonly assertions: readonly string[];
}
