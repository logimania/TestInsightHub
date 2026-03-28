export type CoverageReportFormat =
  | "istanbul"
  | "coveragepy"
  | "go-coverprofile"
  | "llvm-cov"
  | "lcov";

export interface NormalizedCoverage {
  readonly reportFormat: CoverageReportFormat;
  readonly files: readonly FileCoverage[];
  readonly generatedAt: string;
}

export interface FileCoverage {
  readonly filePath: string;
  readonly lineCoverage: CoverageMetric;
  readonly branchCoverage: CoverageMetric | null;
  readonly functionCoverage: CoverageMetric;
  readonly uncoveredLines: readonly LineRange[];
  readonly uncoveredFunctions: readonly string[];
  readonly coveredByTests: readonly TestReference[];
}

export interface CoverageMetric {
  readonly covered: number;
  readonly total: number;
  readonly percentage: number;
}

export interface LineRange {
  readonly start: number;
  readonly end: number;
  readonly functionName?: string;
}

export interface TestReference {
  readonly testFilePath: string;
  readonly testName: string;
  readonly testType: TestType;
}

export type TestType = "unit" | "integration" | "e2e";

export interface ModuleCoverage {
  readonly moduleId: string;
  readonly lineCoverage: CoverageMetric;
  readonly branchCoverage: CoverageMetric | null;
  readonly functionCoverage: CoverageMetric;
  readonly files: readonly FileCoverage[];
  readonly colorLevel: CoverageColorLevel;
}

export type CoverageColorLevel = "green" | "yellow" | "red" | "grey";
export type CoverageMode = "line" | "branch" | "function";
