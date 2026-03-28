import { describe, it, expect } from "vitest";
import { mapTestsToCoverage } from "../../../src/main/services/coverage-analyzer/test-source-mapper";
import type { ParsedFile } from "@shared/types/project";
import type { FileCoverage } from "@shared/types/coverage";

function makeSourceFile(path: string, imports: string[] = []): ParsedFile {
  return { path, language: "typescript", loc: 10, functions: [], imports };
}

function makeTestFile(path: string, imports: string[]): ParsedFile {
  return { path, language: "typescript", loc: 10, functions: [], imports };
}

function makeCoverage(filePath: string): FileCoverage {
  return {
    filePath,
    lineCoverage: { covered: 5, total: 10, percentage: 50 },
    branchCoverage: null,
    functionCoverage: { covered: 2, total: 4, percentage: 50 },
    uncoveredLines: [],
    uncoveredFunctions: [],
    coveredByTests: [],
  };
}

describe("test-source-mapper", () => {
  it("maps tests to source files via import analysis", () => {
    const allFiles: ParsedFile[] = [
      makeSourceFile("src/api/handler.ts"),
      makeTestFile("tests/api/handler.test.ts", ["../../src/api/handler"]),
    ];
    const coverageFiles = [makeCoverage("src/api/handler.ts")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    expect(result[0].coveredByTests.length).toBe(1);
    expect(result[0].coveredByTests[0].testFilePath).toBe(
      "tests/api/handler.test.ts",
    );
    expect(result[0].coveredByTests[0].testType).toBe("unit");
  });

  it("maps tests via naming convention", () => {
    const allFiles: ParsedFile[] = [
      makeSourceFile("src/repo/user-repo.ts"),
      makeTestFile("tests/unit/user-repo.test.ts", []), // no imports
    ];
    const coverageFiles = [makeCoverage("src/repo/user-repo.ts")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    expect(result[0].coveredByTests.length).toBe(1);
    expect(result[0].coveredByTests[0].testType).toBe("unit");
  });

  it("classifies test types from directory names", () => {
    const allFiles: ParsedFile[] = [
      makeSourceFile("src/service.ts"),
      makeTestFile("tests/unit/service.test.ts", ["../../src/service"]),
      makeTestFile("tests/integration/service.test.ts", ["../../src/service"]),
      makeTestFile("tests/e2e/service.test.ts", ["../../src/service"]),
    ];
    const coverageFiles = [makeCoverage("src/service.ts")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    expect(result[0].coveredByTests.length).toBe(3);
    const types = result[0].coveredByTests.map((t) => t.testType).sort();
    expect(types).toEqual(["e2e", "integration", "unit"]);
  });

  it("leaves coveredByTests empty for source files with no matching test", () => {
    const allFiles: ParsedFile[] = [
      makeSourceFile("src/utils/helper.ts"),
      makeTestFile("tests/other.test.ts", ["../../src/other"]),
    ];
    const coverageFiles = [makeCoverage("src/utils/helper.ts")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    expect(result[0].coveredByTests.length).toBe(0);
  });

  it("handles Python test naming convention", () => {
    const allFiles: ParsedFile[] = [
      { ...makeSourceFile("src/handler.py"), language: "python" },
      { ...makeTestFile("tests/test_handler.py", []), language: "python" },
    ];
    const coverageFiles = [makeCoverage("src/handler.py")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    expect(result[0].coveredByTests.length).toBe(1);
  });

  it("handles Go test naming convention", () => {
    const allFiles: ParsedFile[] = [
      { ...makeSourceFile("pkg/handler.go"), language: "go" },
      { ...makeTestFile("pkg/handler_test.go", []), language: "go" },
    ];
    const coverageFiles = [makeCoverage("pkg/handler.go")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    expect(result[0].coveredByTests.length).toBe(1);
  });

  it("deduplicates test references", () => {
    const allFiles: ParsedFile[] = [
      makeSourceFile("src/api.ts"),
      makeTestFile("tests/unit/api.test.ts", ["../../src/api"]), // import + naming both match
    ];
    const coverageFiles = [makeCoverage("src/api.ts")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    expect(result[0].coveredByTests.length).toBe(1);
  });

  it("handles empty file list", () => {
    const result = mapTestsToCoverage([], []);
    expect(result).toEqual([]);
  });

  it("handles coverage files with no matching source files in allFiles", () => {
    const allFiles: ParsedFile[] = [makeSourceFile("src/other.ts")];
    const coverageFiles = [makeCoverage("src/missing.ts")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    expect(result[0].coveredByTests.length).toBe(0);
  });

  it("ignores non-relative imports", () => {
    const allFiles: ParsedFile[] = [
      makeSourceFile("src/handler.ts"),
      makeTestFile("tests/handler.test.ts", [
        "lodash",
        "@shared/utils",
        "vitest",
      ]),
    ];
    const coverageFiles = [makeCoverage("src/handler.ts")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    // Only naming convention match, no import-based match
    expect(result[0].coveredByTests.length).toBe(1);
  });

  it("resolves imports with explicit extensions", () => {
    const allFiles: ParsedFile[] = [
      makeSourceFile("src/util.ts"),
      makeTestFile("tests/util.test.ts", ["../src/util.ts"]),
    ];
    const coverageFiles = [makeCoverage("src/util.ts")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    expect(result[0].coveredByTests.length).toBe(1);
  });

  it("resolves imports to index files", () => {
    const allFiles: ParsedFile[] = [
      makeSourceFile("src/utils/index.ts"),
      makeTestFile("tests/utils.test.ts", ["../src/utils"]),
    ];
    const coverageFiles = [makeCoverage("src/utils/index.ts")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    expect(result[0].coveredByTests.length).toBe(1);
  });

  it("handles multiple test files covering the same source", () => {
    const allFiles: ParsedFile[] = [
      makeSourceFile("src/service.ts"),
      makeTestFile("tests/unit/service.test.ts", ["../../src/service"]),
      makeTestFile("tests/integration/service.test.ts", ["../../src/service"]),
    ];
    const coverageFiles = [makeCoverage("src/service.ts")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    expect(result[0].coveredByTests.length).toBe(2);
  });

  it("handles test file covering multiple source files", () => {
    const allFiles: ParsedFile[] = [
      makeSourceFile("src/a.ts"),
      makeSourceFile("src/b.ts"),
      makeTestFile("tests/combined.test.ts", ["../src/a", "../src/b"]),
    ];
    const coverageFiles = [makeCoverage("src/a.ts"), makeCoverage("src/b.ts")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    expect(result[0].coveredByTests.length).toBe(1);
    expect(result[1].coveredByTests.length).toBe(1);
  });

  it("does not add naming convention match if already found via import", () => {
    const allFiles: ParsedFile[] = [
      makeSourceFile("src/handler.ts"),
      makeTestFile("tests/unit/handler.test.ts", ["../../src/handler"]),
    ];
    const coverageFiles = [makeCoverage("src/handler.ts")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    // Should be 1, not 2 (no duplicate from naming convention)
    expect(result[0].coveredByTests.length).toBe(1);
  });

  it("handles .. path resolution correctly", () => {
    const allFiles: ParsedFile[] = [
      makeSourceFile("src/deep/nested/file.ts"),
      makeTestFile("tests/unit/deep/file.test.ts", [
        "../../../src/deep/nested/file",
      ]),
    ];
    const coverageFiles = [makeCoverage("src/deep/nested/file.ts")];

    const result = mapTestsToCoverage(allFiles, coverageFiles);

    expect(result[0].coveredByTests.length).toBe(1);
  });
});
