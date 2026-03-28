import { describe, it, expect } from "vitest";
import { evaluateQualityGate } from "../../../src/shared/utils/quality-gate";
import type { ModuleCoverage, CoverageMetric } from "@shared/types/coverage";

function makeMetric(pct: number): CoverageMetric {
  return { covered: pct, total: 100, percentage: pct };
}

function makeModule(id: string, pct: number): ModuleCoverage {
  return {
    moduleId: id,
    lineCoverage: makeMetric(pct),
    branchCoverage: null,
    functionCoverage: makeMetric(pct),
    files: [
      {
        filePath: `${id}/file.ts`,
        lineCoverage: makeMetric(pct),
        branchCoverage: null,
        functionCoverage: makeMetric(pct),
        uncoveredLines: [],
        uncoveredFunctions: [],
        coveredByTests: [],
      },
    ],
    colorLevel:
      pct >= 80 ? "green" : pct >= 50 ? "yellow" : pct > 0 ? "red" : "grey",
  };
}

describe("evaluateQualityGate", () => {
  it("passes when all modules meet threshold", () => {
    const modules = [makeModule("src/api", 90), makeModule("src/lib", 85)];
    const result = evaluateQualityGate(modules, 80);

    expect(result.passed).toBe(true);
    expect(result.failedModules).toEqual([]);
    expect(result.verdict).toContain("合格");
  });

  it("fails when one module is below threshold", () => {
    const modules = [makeModule("src/api", 90), makeModule("src/renderer", 30)];
    const result = evaluateQualityGate(modules, 80);

    expect(result.passed).toBe(false);
    expect(result.failedModules).toEqual(["src/renderer"]);
    expect(result.verdict).toContain("不合格");
    expect(result.verdict).toContain("src/renderer");
  });

  it("fails when multiple modules are below threshold", () => {
    const modules = [
      makeModule("src/api", 90),
      makeModule("src/renderer", 30),
      makeModule("src/hooks", 0),
    ];
    const result = evaluateQualityGate(modules, 80);

    expect(result.passed).toBe(false);
    expect(result.failedModules.length).toBe(2);
    expect(result.failedModules).toContain("src/renderer");
    expect(result.failedModules).toContain("src/hooks");
  });

  it("fails grey modules (no coverage data)", () => {
    const greyModule: ModuleCoverage = {
      moduleId: "src/untested",
      lineCoverage: makeMetric(0),
      branchCoverage: null,
      functionCoverage: makeMetric(0),
      files: [],
      colorLevel: "grey",
    };
    const result = evaluateQualityGate([greyModule], 80);

    expect(result.passed).toBe(false);
    expect(result.failedModules).toContain("src/untested");
  });

  it("returns per-module results", () => {
    const modules = [makeModule("src/api", 90), makeModule("src/lib", 50)];
    const result = evaluateQualityGate(modules, 80);

    expect(result.moduleResults.length).toBe(2);

    const api = result.moduleResults.find((r) => r.moduleId === "src/api");
    expect(api?.passed).toBe(true);
    expect(api?.coverage).toBe(90);

    const lib = result.moduleResults.find((r) => r.moduleId === "src/lib");
    expect(lib?.passed).toBe(false);
    expect(lib?.coverage).toBe(50);
  });

  it("counts untested files", () => {
    const mod: ModuleCoverage = {
      moduleId: "src/mixed",
      lineCoverage: makeMetric(40),
      branchCoverage: null,
      functionCoverage: makeMetric(40),
      files: [
        {
          filePath: "src/mixed/a.ts",
          lineCoverage: makeMetric(80),
          branchCoverage: null,
          functionCoverage: makeMetric(80),
          uncoveredLines: [],
          uncoveredFunctions: [],
          coveredByTests: [],
        },
        {
          filePath: "src/mixed/b.ts",
          lineCoverage: makeMetric(0),
          branchCoverage: null,
          functionCoverage: makeMetric(0),
          uncoveredLines: [],
          uncoveredFunctions: [],
          coveredByTests: [],
        },
      ],
      colorLevel: "red",
    };
    const result = evaluateQualityGate([mod], 80);
    expect(result.moduleResults[0].untestedFileCount).toBe(1);
    expect(result.moduleResults[0].fileCount).toBe(2);
  });

  it("includes threshold in verdict", () => {
    const result = evaluateQualityGate([makeModule("src/a", 90)], 70);
    expect(result.verdict).toContain("70%");
  });

  it("handles empty modules list", () => {
    const result = evaluateQualityGate([], 80);
    expect(result.passed).toBe(true);
    expect(result.failedModules).toEqual([]);
  });

  it("excludes non-src modules from gate evaluation", () => {
    const modules = [
      makeModule("src/api", 90),
      makeModule("tests/unit", 0),
      makeModule("coverage", 0),
      makeModule("eval/backup", 0),
      makeModule("node_modules/lib", 0),
    ];
    const result = evaluateQualityGate(modules, 80);

    expect(result.passed).toBe(true);
    expect(result.moduleResults.length).toBe(1);
    expect(result.moduleResults[0].moduleId).toBe("src/api");
  });

  it("only evaluates src/ prefixed modules", () => {
    const modules = [
      makeModule("src/main", 85),
      makeModule("src/renderer", 30),
      makeModule("tests/fixtures", 0),
      makeModule(".", 0),
    ];
    const result = evaluateQualityGate(modules, 80);

    expect(result.passed).toBe(false);
    expect(result.failedModules).toEqual(["src/renderer"]);
    expect(result.moduleResults.length).toBe(2);
  });
});
