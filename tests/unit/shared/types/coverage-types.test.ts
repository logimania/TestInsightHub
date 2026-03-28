import { describe, it, expect } from "vitest";
import type {
  CoverageReportFormat,
  NormalizedCoverage,
  FileCoverage,
  CoverageMetric,
  LineRange,
  TestReference,
  TestType,
  ModuleCoverage,
  CoverageColorLevel,
  CoverageMode,
} from "../../../../src/shared/types/coverage";

describe("shared/types/coverage", () => {
  it("CoverageReportFormat accepts valid format strings", () => {
    const formats: CoverageReportFormat[] = [
      "istanbul",
      "coveragepy",
      "go-coverprofile",
      "llvm-cov",
      "lcov",
    ];
    expect(formats).toHaveLength(5);
  });

  it("NormalizedCoverage structure is valid", () => {
    const coverage: NormalizedCoverage = {
      reportFormat: "istanbul",
      files: [],
      generatedAt: "2026-01-01T00:00:00Z",
    };
    expect(coverage.reportFormat).toBe("istanbul");
    expect(coverage.files).toHaveLength(0);
  });

  it("FileCoverage structure is complete", () => {
    const file: FileCoverage = {
      filePath: "src/index.ts",
      lineCoverage: { covered: 80, total: 100, percentage: 80 },
      branchCoverage: null,
      functionCoverage: { covered: 5, total: 10, percentage: 50 },
      uncoveredLines: [{ start: 1, end: 10 }],
      uncoveredFunctions: ["init"],
      coveredByTests: [],
    };
    expect(file.filePath).toBe("src/index.ts");
    expect(file.branchCoverage).toBeNull();
    expect(file.uncoveredFunctions).toContain("init");
  });

  it("CoverageMetric contains covered, total, and percentage", () => {
    const metric: CoverageMetric = { covered: 50, total: 100, percentage: 50 };
    expect(metric.percentage).toBe(50);
  });

  it("LineRange supports optional functionName", () => {
    const range: LineRange = { start: 1, end: 10, functionName: "test" };
    expect(range.functionName).toBe("test");

    const rangeNoFn: LineRange = { start: 1, end: 10 };
    expect(rangeNoFn.functionName).toBeUndefined();
  });

  it("TestReference holds test info", () => {
    const ref: TestReference = {
      testFilePath: "tests/test.ts",
      testName: "should work",
      testType: "unit",
    };
    expect(ref.testType).toBe("unit");
  });

  it("TestType accepts unit, integration, e2e", () => {
    const types: TestType[] = ["unit", "integration", "e2e"];
    expect(types).toHaveLength(3);
  });

  it("ModuleCoverage structure is valid", () => {
    const mc: ModuleCoverage = {
      moduleId: "src/main",
      lineCoverage: { covered: 80, total: 100, percentage: 80 },
      branchCoverage: null,
      functionCoverage: { covered: 5, total: 10, percentage: 50 },
      files: [],
      colorLevel: "green",
    };
    expect(mc.moduleId).toBe("src/main");
    expect(mc.colorLevel).toBe("green");
  });

  it("CoverageColorLevel accepts valid colors", () => {
    const levels: CoverageColorLevel[] = ["green", "yellow", "red", "grey"];
    expect(levels).toHaveLength(4);
  });

  it("CoverageMode accepts line, branch, function", () => {
    const modes: CoverageMode[] = ["line", "branch", "function"];
    expect(modes).toHaveLength(3);
  });
});
