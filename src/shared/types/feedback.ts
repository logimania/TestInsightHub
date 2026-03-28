import type { TestType } from "./coverage";

export interface FeedbackFile {
  readonly version: string;
  readonly generatedAt: string;
  readonly projectRoot: string;
  readonly coverageThreshold: number;
  readonly qualityGate: QualityGate;
  readonly summary: FeedbackSummary;
  readonly gaps: readonly CoverageGap[];
  readonly recommendations: readonly TestRecommendation[];
}

export interface QualityGate {
  readonly passed: boolean;
  readonly verdict: string;
  readonly moduleResults: readonly ModuleGateResult[];
  readonly failedModules: readonly string[];
}

export interface ModuleGateResult {
  readonly moduleId: string;
  readonly coverage: number;
  readonly threshold: number;
  readonly passed: boolean;
  readonly fileCount: number;
  readonly untestedFileCount: number;
}

export interface FeedbackSummary {
  readonly totalModules: number;
  readonly belowThreshold: number;
  readonly totalUncoveredFunctions: number;
  readonly overallCoverage: number;
}

export interface CoverageGap {
  readonly filePath: string;
  readonly moduleName: string;
  readonly currentCoverage: number;
  readonly targetCoverage: number;
  readonly uncoveredLines: readonly {
    readonly start: number;
    readonly end: number;
    readonly functionName: string;
  }[];
  readonly recommendedTestType: TestType;
  readonly priority: "high" | "medium" | "low";
  readonly priorityScore: number;
  readonly complexity: number;
  readonly changeFrequency: number;
}

export interface TestRecommendation {
  readonly type: TestType;
  readonly targetFile: string;
  readonly suggestedTestFile: string;
  readonly functions: readonly string[];
  readonly description: string;
}

export interface FeedbackComparison {
  readonly previousFeedbackAt: string;
  readonly currentFeedbackAt: string;
  readonly improved: readonly GapChange[];
  readonly unchanged: readonly GapChange[];
  readonly newGaps: readonly CoverageGap[];
  readonly improvementRate: number;
}

export interface GapChange {
  readonly filePath: string;
  readonly previousCoverage: number;
  readonly currentCoverage: number;
  readonly targetCoverage: number;
}

export interface PriorityWeights {
  readonly coverageGapWeight: number;
  readonly complexityWeight: number;
  readonly changeFreqWeight: number;
}
