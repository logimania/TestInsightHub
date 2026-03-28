import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import * as llvmCov from "../../../src/main/services/coverage-analyzer/parsers/llvm-cov-parser";

const FIXTURE_PATH = resolve(__dirname, "../../fixtures");

describe("llvm-cov Parser", () => {
  describe("canParse", () => {
    it("returns true for valid llvm-cov JSON export", () => {
      const content = readFileSync(
        resolve(FIXTURE_PATH, "llvm-cov-report.json"),
        "utf-8",
      );
      expect(llvmCov.canParse(content)).toBeTruthy();
    });

    it("returns false for non-JSON content", () => {
      expect(llvmCov.canParse("not json")).toBe(false);
    });

    it("returns false for JSON without data key", () => {
      expect(llvmCov.canParse('{"files": []}')).toBe(false);
    });

    it("returns false for JSON where data is not an array", () => {
      expect(llvmCov.canParse('{"data": "string"}')).toBe(false);
    });

    it("returns falsy for empty data array (no files entry)", () => {
      expect(llvmCov.canParse('{"data": []}')).toBeFalsy();
    });

    it("returns falsy for data entry without files", () => {
      expect(llvmCov.canParse('{"data": [{"totals": {}}]}')).toBeFalsy();
    });

    it("returns false for empty string", () => {
      expect(llvmCov.canParse("")).toBe(false);
    });
  });

  describe("parse", () => {
    const content = readFileSync(
      resolve(FIXTURE_PATH, "llvm-cov-report.json"),
      "utf-8",
    );

    it("parses all files from the report", () => {
      const files = llvmCov.parse(content, "/project");
      expect(files.length).toBe(2);
    });

    it("extracts line coverage from summary", () => {
      const files = llvmCov.parse(content, "/project");
      const main = files.find((f) => f.filePath.includes("main.rs"));
      expect(main).toBeDefined();
      expect(main!.lineCoverage.covered).toBe(15);
      expect(main!.lineCoverage.total).toBe(20);
      expect(main!.lineCoverage.percentage).toBe(75.0);
    });

    it("extracts function coverage from summary", () => {
      const files = llvmCov.parse(content, "/project");
      const main = files.find((f) => f.filePath.includes("main.rs"));
      expect(main!.functionCoverage.covered).toBe(4);
      expect(main!.functionCoverage.total).toBe(5);
      expect(main!.functionCoverage.percentage).toBe(80.0);
    });

    it("extracts branch coverage when present", () => {
      const files = llvmCov.parse(content, "/project");
      const main = files.find((f) => f.filePath.includes("main.rs"));
      expect(main!.branchCoverage).not.toBeNull();
      expect(main!.branchCoverage!.covered).toBe(6);
      expect(main!.branchCoverage!.total).toBe(8);
      expect(main!.branchCoverage!.percentage).toBe(75.0);
    });

    it("sets branch coverage to null when branches not in summary", () => {
      const files = llvmCov.parse(content, "/project");
      const lib = files.find((f) => f.filePath.includes("lib.rs"));
      expect(lib!.branchCoverage).toBeNull();
    });

    it("extracts uncovered lines from segments with count 0", () => {
      const files = llvmCov.parse(content, "/project");
      const main = files.find((f) => f.filePath.includes("main.rs"));
      // Segments [10,1,0,...] and [15,1,0,...] have count 0
      expect(main!.uncoveredLines.length).toBe(2);
      expect(main!.uncoveredLines[0]).toEqual({ start: 10, end: 10 });
      expect(main!.uncoveredLines[1]).toEqual({ start: 15, end: 15 });
    });

    it("has no uncovered lines when no segments present", () => {
      const files = llvmCov.parse(content, "/project");
      const lib = files.find((f) => f.filePath.includes("lib.rs"));
      expect(lib!.uncoveredLines).toEqual([]);
    });

    it("normalizes backslashes in filenames to forward slashes", () => {
      const files = llvmCov.parse(content, "/project");
      const lib = files.find((f) => f.filePath.includes("lib.rs"));
      expect(lib!.filePath).not.toContain("\\");
      expect(lib!.filePath).toContain("src/lib.rs");
    });

    it("sets empty uncoveredFunctions and coveredByTests", () => {
      const files = llvmCov.parse(content, "/project");
      for (const f of files) {
        expect(f.uncoveredFunctions).toEqual([]);
        expect(f.coveredByTests).toEqual([]);
      }
    });

    it("throws on invalid JSON", () => {
      expect(() => llvmCov.parse("not json", "/project")).toThrow();
    });

    it("handles multiple data entries", () => {
      const report = JSON.stringify({
        data: [
          {
            files: [
              {
                filename: "a.rs",
                summary: {
                  lines: { count: 5, covered: 5, percent: 100 },
                  functions: { count: 2, covered: 2, percent: 100 },
                },
              },
            ],
          },
          {
            files: [
              {
                filename: "b.rs",
                summary: {
                  lines: { count: 3, covered: 1, percent: 33.3 },
                  functions: { count: 1, covered: 0, percent: 0 },
                },
              },
            ],
          },
        ],
      });
      const files = llvmCov.parse(report, "/project");
      expect(files.length).toBe(2);
      expect(files[0].filePath).toBe("a.rs");
      expect(files[1].filePath).toBe("b.rs");
    });

    it("handles segments where all lines are covered (count > 0)", () => {
      const report = JSON.stringify({
        data: [
          {
            files: [
              {
                filename: "covered.rs",
                summary: {
                  lines: { count: 3, covered: 3, percent: 100 },
                  functions: { count: 1, covered: 1, percent: 100 },
                },
                segments: [
                  [1, 1, 5, true, true],
                  [2, 1, 3, true, true],
                ],
              },
            ],
          },
        ],
      });
      const files = llvmCov.parse(report, "/project");
      expect(files[0].uncoveredLines).toEqual([]);
    });

    it("returns empty array for report with no data entries", () => {
      const report = JSON.stringify({ data: [] });
      const files = llvmCov.parse(report, "/project");
      expect(files).toEqual([]);
    });

    it("handles 100% line and function coverage", () => {
      const files = llvmCov.parse(content, "/project");
      const lib = files.find((f) => f.filePath.includes("lib.rs"));
      expect(lib!.lineCoverage.percentage).toBe(100.0);
      expect(lib!.functionCoverage.percentage).toBe(100.0);
    });
  });
});
