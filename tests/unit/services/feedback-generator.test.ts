import { describe, it, expect } from "vitest";
import { generateFeedback } from "../../../src/main/services/feedback-generator";
import type { ModuleCoverage, FileCoverage } from "@shared/types/coverage";
import type {
  ProjectStructure,
  ModuleNode,
  ParsedFile,
} from "@shared/types/project";

function makeFile(path: string, complexity: number = 3): ParsedFile {
  return {
    path,
    language: "typescript",
    loc: 50,
    functions: [{ name: "fn1", startLine: 1, endLine: 10, complexity }],
    imports: [],
  };
}

function makeModule(id: string, files: ParsedFile[]): ModuleNode {
  return {
    id,
    name: id.split("/").pop() ?? id,
    path: id,
    files,
    fileCount: files.length,
    functionCount: files.reduce((s, f) => s + f.functions.length, 0),
    totalLoc: files.reduce((s, f) => s + f.loc, 0),
    children: [],
  };
}

function makeStructure(modules: ModuleNode[]): ProjectStructure {
  return {
    rootPath: "/project",
    modules,
    edges: [],
    totalFiles: modules.reduce((s, m) => s + m.fileCount, 0),
    totalLoc: modules.reduce((s, m) => s + m.totalLoc, 0),
    parsedAt: new Date().toISOString(),
    parseErrors: [],
  };
}

function makeModuleCoverage(
  moduleId: string,
  percentage: number,
): ModuleCoverage {
  const fc: FileCoverage = {
    filePath: `${moduleId}/file.ts`,
    lineCoverage: { covered: percentage, total: 100, percentage },
    branchCoverage: null,
    functionCoverage: { covered: percentage, total: 100, percentage },
    uncoveredLines:
      percentage < 100 ? [{ start: 5, end: 10, functionName: "fn1" }] : [],
    uncoveredFunctions: percentage < 100 ? ["fn1"] : [],
    coveredByTests: [],
  };
  return {
    moduleId,
    lineCoverage: { covered: percentage, total: 100, percentage },
    branchCoverage: null,
    functionCoverage: { covered: percentage, total: 100, percentage },
    files: [fc],
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

describe("generateFeedback", () => {
  it("generates complete feedback with all fields", () => {
    const modules = [
      makeModule("src/api", [makeFile("src/api/handler.ts")]),
      makeModule("src/repo", [makeFile("src/repo/user-repo.ts", 15)]),
    ];
    const structure = makeStructure(modules);
    const coverages = [
      makeModuleCoverage("src/api", 90),
      makeModuleCoverage("src/repo", 35),
    ];

    const fb = generateFeedback({
      moduleCoverages: coverages,
      projectStructure: structure,
      threshold: 80,
    });

    expect(fb.version).toBe("1.1.0");
    expect(fb.coverageThreshold).toBe(80);
    expect(fb.summary.totalModules).toBe(2);
    expect(fb.summary.belowThreshold).toBe(1);
    expect(fb.gaps.length).toBe(1);
    expect(fb.gaps[0].filePath).toContain("repo");
    expect(fb.recommendations.length).toBe(1);
  });

  it("sorts gaps by priority score descending", () => {
    const modules = [
      makeModule("src/a", [makeFile("src/a/a.ts", 20)]),
      makeModule("src/b", [makeFile("src/b/b.ts", 5)]),
    ];
    const structure = makeStructure(modules);
    const coverages = [
      makeModuleCoverage("src/a", 30),
      makeModuleCoverage("src/b", 10),
    ];

    const fb = generateFeedback({
      moduleCoverages: coverages,
      projectStructure: structure,
      threshold: 80,
    });

    expect(fb.gaps.length).toBe(2);
    expect(fb.gaps[0].priorityScore).toBeGreaterThanOrEqual(
      fb.gaps[1].priorityScore,
    );
  });

  it("returns empty gaps when all above threshold", () => {
    const modules = [makeModule("src/api", [makeFile("src/api/handler.ts")])];
    const structure = makeStructure(modules);
    const coverages = [makeModuleCoverage("src/api", 95)];

    const fb = generateFeedback({
      moduleCoverages: coverages,
      projectStructure: structure,
      threshold: 80,
    });

    expect(fb.gaps.length).toBe(0);
    expect(fb.summary.belowThreshold).toBe(0);
  });

  it("respects custom weights", () => {
    const modules = [makeModule("src/a", [makeFile("src/a/a.ts", 50)])];
    const structure = makeStructure(modules);
    const coverages = [makeModuleCoverage("src/a", 10)];

    const fb = generateFeedback({
      moduleCoverages: coverages,
      projectStructure: structure,
      threshold: 80,
      weights: {
        coverageGapWeight: 1.0,
        complexityWeight: 0,
        changeFreqWeight: 0,
      },
    });

    expect(fb.gaps[0].priorityScore).toBeGreaterThan(80);
  });
});
