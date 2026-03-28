import { describe, it, expect } from "vitest";
import {
  detectGaps,
  buildRecommendations,
} from "../../../src/main/services/feedback-generator/gap-detector";
import type { ModuleCoverage, FileCoverage } from "@shared/types/coverage";

function makeFileCoverage(filePath: string, percentage: number): FileCoverage {
  return {
    filePath,
    lineCoverage: { covered: percentage, total: 100, percentage },
    branchCoverage: null,
    functionCoverage: { covered: percentage, total: 100, percentage },
    uncoveredLines:
      percentage < 100 ? [{ start: 10, end: 20, functionName: "testFn" }] : [],
    uncoveredFunctions: percentage < 100 ? ["testFn"] : [],
    coveredByTests: [],
  };
}

function makeModuleCoverage(
  moduleId: string,
  files: FileCoverage[],
  percentage: number,
): ModuleCoverage {
  return {
    moduleId,
    lineCoverage: { covered: percentage, total: 100, percentage },
    branchCoverage: null,
    functionCoverage: { covered: percentage, total: 100, percentage },
    files,
    colorLevel:
      percentage >= 80
        ? "green"
        : percentage >= 50
          ? "yellow"
          : percentage > 0
            ? "red"
            : "grey",
  };
}

describe("detectGaps", () => {
  it("detects modules below threshold", () => {
    const modules: ModuleCoverage[] = [
      makeModuleCoverage(
        "src/api",
        [makeFileCoverage("src/api/handler.ts", 90)],
        90,
      ),
      makeModuleCoverage(
        "src/repo",
        [makeFileCoverage("src/repo/user-repo.ts", 40)],
        40,
      ),
    ];

    const gaps = detectGaps(modules, 80);
    expect(gaps.length).toBe(1);
    expect(gaps[0].filePath).toBe("src/repo/user-repo.ts");
    expect(gaps[0].currentCoverage).toBe(40);
    expect(gaps[0].targetCoverage).toBe(80);
  });

  it("skips grey (no coverage) modules", () => {
    const modules: ModuleCoverage[] = [makeModuleCoverage("src/utils", [], 0)];
    modules[0] = { ...modules[0], colorLevel: "grey" };

    const gaps = detectGaps(modules, 80);
    expect(gaps.length).toBe(0);
  });

  it("returns empty when all above threshold", () => {
    const modules: ModuleCoverage[] = [
      makeModuleCoverage(
        "src/api",
        [makeFileCoverage("src/api/handler.ts", 95)],
        95,
      ),
    ];

    const gaps = detectGaps(modules, 80);
    expect(gaps.length).toBe(0);
  });

  it("includes uncovered lines in gaps", () => {
    const modules: ModuleCoverage[] = [
      makeModuleCoverage(
        "src/repo",
        [makeFileCoverage("src/repo/a.ts", 30)],
        30,
      ),
    ];

    const gaps = detectGaps(modules, 80);
    expect(gaps[0].uncoveredLines.length).toBeGreaterThan(0);
    expect(gaps[0].uncoveredLines[0].functionName).toBe("testFn");
  });
});

describe("buildRecommendations", () => {
  it("generates recommendations from gaps", () => {
    const gaps = detectGaps(
      [
        makeModuleCoverage(
          "src/repo",
          [makeFileCoverage("src/repo/user-repo.ts", 40)],
          40,
        ),
      ],
      80,
    );

    const recs = buildRecommendations(gaps);
    expect(recs.length).toBe(1);
    expect(recs[0].targetFile).toBe("src/repo/user-repo.ts");
    expect(recs[0].suggestedTestFile).toContain("__tests__");
    expect(recs[0].functions).toContain("testFn");
  });

  it("returns empty for no gaps", () => {
    const recs = buildRecommendations([]);
    expect(recs.length).toBe(0);
  });
});
