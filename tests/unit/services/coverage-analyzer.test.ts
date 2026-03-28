import { describe, it, expect, vi, beforeEach } from "vitest";
import { join } from "path";

const { mockReadFile, mockExistsSync } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockExistsSync: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  default: { readFile: mockReadFile },
  readFile: mockReadFile,
}));
vi.mock("fs", () => ({
  default: { existsSync: mockExistsSync },
  existsSync: mockExistsSync,
}));

import { loadCoverage } from "../../../src/main/services/coverage-analyzer/index";

// A minimal valid Istanbul report for testing the happy path
const VALID_ISTANBUL_REPORT = JSON.stringify({
  "/project/src/handler.ts": {
    path: "/project/src/handler.ts",
    statementMap: {
      "0": { start: { line: 1, column: 0 }, end: { line: 1, column: 20 } },
    },
    s: { "0": 1 },
    fnMap: {
      "0": {
        name: "handle",
        decl: { start: { line: 1, column: 0 }, end: { line: 1, column: 20 } },
        loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 20 } },
      },
    },
    f: { "0": 1 },
    branchMap: {},
    b: {},
  },
});

// A minimal coverage.py report
const VALID_COVERAGEPY_REPORT = JSON.stringify({
  files: {
    "src/app.py": {
      executed_lines: [1, 2, 3],
      missing_lines: [4, 5],
      summary: { covered_lines: 3, num_statements: 5, percent_covered: 60 },
    },
  },
});

describe("loadCoverage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("with explicit reportPath", () => {
    it("loads and parses an Istanbul report successfully", async () => {
      mockReadFile.mockResolvedValue(VALID_ISTANBUL_REPORT);

      const result = await loadCoverage({
        rootPath: "/project",
        reportPath: "/project/coverage/coverage-final.json",
      });

      expect(result.coverage.files.length).toBeGreaterThan(0);
      expect(result.coverage.reportFormat).toBe("istanbul");
      expect(result.matchRate).toBe(100);
      expect(result.unmatchedFiles).toEqual([]);
    });

    it("loads and parses a coverage.py report successfully", async () => {
      mockReadFile.mockResolvedValue(VALID_COVERAGEPY_REPORT);

      const result = await loadCoverage({
        rootPath: "/project",
        reportPath: "/project/coverage.json",
      });

      expect(result.coverage.files.length).toBe(1);
      expect(result.coverage.reportFormat).toBe("coveragepy");
    });

    it("throws COVERAGE_FORMAT_INVALID when file cannot be read", async () => {
      mockReadFile.mockRejectedValue(new Error("ENOENT"));

      await expect(
        loadCoverage({
          rootPath: "/project",
          reportPath: "/nonexistent/file.json",
        }),
      ).rejects.toMatchObject({
        code: "COVERAGE_FORMAT_INVALID",
        recoverable: true,
      });
    });

    it("throws COVERAGE_FORMAT_UNKNOWN for unrecognized format", async () => {
      mockReadFile.mockResolvedValue('{"randomKey": 123}');

      await expect(
        loadCoverage({
          rootPath: "/project",
          reportPath: "/project/unknown-report.dat",
        }),
      ).rejects.toMatchObject({
        code: "COVERAGE_FORMAT_UNKNOWN",
        recoverable: true,
      });
    });

    it("throws COVERAGE_FORMAT_INVALID when parsing fails", async () => {
      const malformedIstanbul = JSON.stringify({
        "/project/src/file.ts": {
          path: "/project/src/file.ts",
          statementMap: "not-an-object",
          s: null,
          fnMap: {},
          f: {},
          branchMap: {},
          b: {},
        },
      });
      mockReadFile.mockResolvedValue(malformedIstanbul);

      await expect(
        loadCoverage({
          rootPath: "/project",
          reportPath: "/project/coverage-final.json",
        }),
      ).rejects.toMatchObject({
        code: "COVERAGE_FORMAT_INVALID",
        recoverable: true,
      });
    });
  });

  describe("auto-detection", () => {
    it("throws COVERAGE_NOT_LOADED when no report found and no autoDetect paths exist", async () => {
      mockExistsSync.mockReturnValue(false);

      await expect(
        loadCoverage({ rootPath: "/project" }),
      ).rejects.toMatchObject({
        code: "COVERAGE_NOT_LOADED",
        recoverable: true,
      });
    });

    it("auto-detects report from standard paths", async () => {
      mockExistsSync.mockImplementation((p: string) => {
        return String(p) === join("/project", "coverage/coverage-final.json");
      });
      mockReadFile.mockResolvedValue(VALID_ISTANBUL_REPORT);

      const result = await loadCoverage({ rootPath: "/project" });

      expect(result.coverage.files.length).toBeGreaterThan(0);
      expect(mockExistsSync).toHaveBeenCalled();
    });

    it("tries multiple paths until one exists", async () => {
      mockExistsSync.mockImplementation((p: string) => {
        return String(p) === join("/project", "coverage.json");
      });
      mockReadFile.mockResolvedValue(VALID_COVERAGEPY_REPORT);

      const result = await loadCoverage({ rootPath: "/project" });
      expect(result.coverage.reportFormat).toBe("coveragepy");
    });
  });

  describe("path mappings", () => {
    it("applies path mappings to file paths", async () => {
      mockReadFile.mockResolvedValue(VALID_COVERAGEPY_REPORT);

      const result = await loadCoverage({
        rootPath: "/project",
        reportPath: "/project/coverage.json",
        pathMappings: [{ reportPrefix: "src/", sourcePrefix: "lib/" }],
      });

      expect(result.coverage.files[0].filePath).toBe("lib/app.py");
    });
  });

  describe("project structure matching", () => {
    it("filters files that match project structure", async () => {
      mockReadFile.mockResolvedValue(VALID_COVERAGEPY_REPORT);

      const result = await loadCoverage({
        rootPath: "/project",
        reportPath: "/project/coverage.json",
        projectStructure: {
          rootPath: "/project",
          modules: [
            {
              id: "root",
              name: "root",
              path: "/project",
              files: [
                {
                  path: "src/app.py",
                  language: "python",
                  loc: 10,
                  functions: [],
                  imports: [],
                },
              ],
              fileCount: 1,
              functionCount: 0,
              totalLoc: 10,
              children: [],
            },
          ],
          edges: [],
          totalFiles: 1,
          totalLoc: 10,
          parsedAt: new Date().toISOString(),
          parseErrors: [],
        },
      });

      expect(result.matchRate).toBe(100);
      expect(result.unmatchedFiles).toEqual([]);
    });

    it("reports unmatched files", async () => {
      mockReadFile.mockResolvedValue(VALID_COVERAGEPY_REPORT);

      const result = await loadCoverage({
        rootPath: "/project",
        reportPath: "/project/coverage.json",
        projectStructure: {
          rootPath: "/project",
          modules: [
            {
              id: "root",
              name: "root",
              path: "/project",
              files: [
                {
                  path: "src/other.py",
                  language: "python",
                  loc: 10,
                  functions: [],
                  imports: [],
                },
              ],
              fileCount: 1,
              functionCount: 0,
              totalLoc: 10,
              children: [],
            },
          ],
          edges: [],
          totalFiles: 1,
          totalLoc: 10,
          parsedAt: new Date().toISOString(),
          parseErrors: [],
        },
      });

      expect(result.matchRate).toBe(0);
      expect(result.unmatchedFiles).toContain("src/app.py");
    });
  });
});
