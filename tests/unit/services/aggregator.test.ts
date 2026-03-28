import { describe, it, expect } from "vitest";
import {
  aggregateByModule,
  determineColorLevel,
} from "../../../src/main/services/coverage-analyzer/aggregator";
import type { FileCoverage } from "@shared/types/coverage";
import type { ModuleNode } from "@shared/types/project";

describe("aggregator", () => {
  const makeFileCoverage = (
    filePath: string,
    linePercent: number,
  ): FileCoverage => ({
    filePath,
    lineCoverage: { covered: linePercent, total: 100, percentage: linePercent },
    branchCoverage: null,
    functionCoverage: {
      covered: linePercent,
      total: 100,
      percentage: linePercent,
    },
    uncoveredLines: [],
    uncoveredFunctions: [],
    coveredByTests: [],
  });

  const makeModule = (id: string, filePaths: string[]): ModuleNode => ({
    id,
    name: id.split("/").pop() ?? id,
    path: id,
    files: filePaths.map((p) => ({
      path: p,
      language: "typescript" as const,
      loc: 10,
      functions: [],
      imports: [],
    })),
    fileCount: filePaths.length,
    functionCount: 0,
    totalLoc: 10 * filePaths.length,
    children: [],
  });

  it("aggregates coverage by module", () => {
    const files: FileCoverage[] = [
      makeFileCoverage("src/api/handler.ts", 90),
      makeFileCoverage("src/repo/user-repo.ts", 40),
    ];
    const modules: ModuleNode[] = [
      makeModule("src/api", ["src/api/handler.ts"]),
      makeModule("src/repo", ["src/repo/user-repo.ts"]),
    ];

    const result = aggregateByModule(files, modules);

    expect(result.length).toBe(2);
    const api = result.find((m) => m.moduleId === "src/api");
    const repo = result.find((m) => m.moduleId === "src/repo");

    expect(api!.colorLevel).toBe("green");
    expect(repo!.colorLevel).toBe("red");
  });

  it("handles modules with no coverage data", () => {
    const modules: ModuleNode[] = [
      makeModule("src/utils", ["src/utils/helper.ts"]),
    ];

    const result = aggregateByModule([], modules);

    expect(result.length).toBe(1);
    expect(result[0].colorLevel).toBe("grey");
    expect(result[0].lineCoverage.percentage).toBe(0);
  });

  it("aggregates metrics from multiple files", () => {
    const files: FileCoverage[] = [
      {
        filePath: "src/repo/a.ts",
        lineCoverage: { covered: 30, total: 50, percentage: 60 },
        branchCoverage: null,
        functionCoverage: { covered: 3, total: 5, percentage: 60 },
        uncoveredLines: [],
        uncoveredFunctions: [],
        coveredByTests: [],
      },
      {
        filePath: "src/repo/b.ts",
        lineCoverage: { covered: 40, total: 50, percentage: 80 },
        branchCoverage: null,
        functionCoverage: { covered: 4, total: 5, percentage: 80 },
        uncoveredLines: [],
        uncoveredFunctions: [],
        coveredByTests: [],
      },
    ];
    const modules: ModuleNode[] = [
      makeModule("src/repo", ["src/repo/a.ts", "src/repo/b.ts"]),
    ];

    const result = aggregateByModule(files, modules);
    const repo = result[0];

    expect(repo.lineCoverage.covered).toBe(70);
    expect(repo.lineCoverage.total).toBe(100);
    expect(repo.lineCoverage.percentage).toBe(70);
    expect(repo.colorLevel).toBe("yellow");
  });
});

describe("determineColorLevel", () => {
  it("returns green for >= 80%", () => {
    expect(determineColorLevel(80)).toBe("green");
    expect(determineColorLevel(100)).toBe("green");
  });

  it("returns yellow for >= 50%", () => {
    expect(determineColorLevel(50)).toBe("yellow");
    expect(determineColorLevel(79)).toBe("yellow");
  });

  it("returns red for > 0%", () => {
    expect(determineColorLevel(1)).toBe("red");
    expect(determineColorLevel(49)).toBe("red");
  });

  it("returns grey for 0%", () => {
    expect(determineColorLevel(0)).toBe("grey");
  });

  it("respects custom thresholds", () => {
    expect(determineColorLevel(60, { green: 90, yellow: 60 })).toBe("yellow");
    expect(determineColorLevel(91, { green: 90, yellow: 60 })).toBe("green");
  });
});
