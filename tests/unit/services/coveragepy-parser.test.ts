import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import * as coveragepy from "../../../src/main/services/coverage-analyzer/parsers/coveragepy-parser";

const FIXTURE_PATH = resolve(__dirname, "../../fixtures");

describe("coverage.py Parser", () => {
  describe("canParse", () => {
    it("returns true for valid coverage.py JSON with files key", () => {
      const content = readFileSync(
        resolve(FIXTURE_PATH, "coveragepy-report.json"),
        "utf-8",
      );
      expect(coveragepy.canParse(content)).toBe(true);
    });

    it("returns false for non-JSON content", () => {
      expect(coveragepy.canParse("not json at all")).toBe(false);
    });

    it("returns false for JSON without files key", () => {
      expect(coveragepy.canParse('{"data": []}')).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(coveragepy.canParse("")).toBe(false);
    });

    it("returns false for JSON where files is not an object", () => {
      expect(coveragepy.canParse('{"files": "string"}')).toBe(false);
    });

    it("returns true for minimal valid structure with empty files", () => {
      expect(coveragepy.canParse('{"files": {}}')).toBe(true);
    });
  });

  describe("parse", () => {
    const content = readFileSync(
      resolve(FIXTURE_PATH, "coveragepy-report.json"),
      "utf-8",
    );

    it("parses all files from the report", () => {
      const files = coveragepy.parse(content, "/project");
      expect(files.length).toBe(2);
    });

    it("calculates line coverage from summary", () => {
      const files = coveragepy.parse(content, "/project");
      const helpers = files.find((f) => f.filePath.includes("helpers"));
      expect(helpers).toBeDefined();
      expect(helpers!.lineCoverage.covered).toBe(7);
      expect(helpers!.lineCoverage.total).toBe(12);
      expect(helpers!.lineCoverage.percentage).toBe(58.33);
    });

    it("calculates 100% coverage correctly", () => {
      const files = coveragepy.parse(content, "/project");
      const user = files.find((f) => f.filePath.includes("user"));
      expect(user).toBeDefined();
      expect(user!.lineCoverage.covered).toBe(5);
      expect(user!.lineCoverage.total).toBe(5);
      expect(user!.lineCoverage.percentage).toBe(100.0);
    });

    it("extracts branch coverage when branches are present", () => {
      const files = coveragepy.parse(content, "/project");
      const helpers = files.find((f) => f.filePath.includes("helpers"));
      expect(helpers!.branchCoverage).not.toBeNull();
      expect(helpers!.branchCoverage!.covered).toBe(2);
      expect(helpers!.branchCoverage!.total).toBe(4);
      expect(helpers!.branchCoverage!.percentage).toBe(50);
    });

    it("sets branch coverage to null when no branch data", () => {
      const files = coveragepy.parse(content, "/project");
      const user = files.find((f) => f.filePath.includes("user"));
      expect(user!.branchCoverage).toBeNull();
    });

    it("groups consecutive missing lines into ranges", () => {
      const files = coveragepy.parse(content, "/project");
      const helpers = files.find((f) => f.filePath.includes("helpers"));
      expect(helpers!.uncoveredLines.length).toBeGreaterThan(0);
      // Lines 7,8 should be one range; 12,13,14 should be another
      const range78 = helpers!.uncoveredLines.find((r) => r.start === 7);
      expect(range78).toBeDefined();
      expect(range78!.end).toBe(8);
      const range12 = helpers!.uncoveredLines.find((r) => r.start === 12);
      expect(range12).toBeDefined();
      expect(range12!.end).toBe(14);
    });

    it("normalizes backslashes in file paths to forward slashes", () => {
      const files = coveragepy.parse(content, "/project");
      const user = files.find((f) => f.filePath.includes("user"));
      expect(user!.filePath).not.toContain("\\");
      expect(user!.filePath).toContain("src/models/user.py");
    });

    it("sets empty uncoveredFunctions and coveredByTests", () => {
      const files = coveragepy.parse(content, "/project");
      for (const f of files) {
        expect(f.uncoveredFunctions).toEqual([]);
        expect(f.coveredByTests).toEqual([]);
      }
    });

    it("returns empty array for report with no files", () => {
      const files = coveragepy.parse('{"files": {}}', "/project");
      expect(files).toEqual([]);
    });

    it("throws on invalid JSON", () => {
      expect(() => coveragepy.parse("not json", "/project")).toThrow();
    });

    it("handles file with only executed branches (no missing)", () => {
      const report = JSON.stringify({
        files: {
          "test.py": {
            executed_lines: [1, 2],
            missing_lines: [],
            summary: {
              covered_lines: 2,
              num_statements: 2,
              percent_covered: 100,
            },
            executed_branches: [
              [1, 2],
              [3, 4],
            ],
          },
        },
      });
      const files = coveragepy.parse(report, "/project");
      expect(files[0].branchCoverage!.covered).toBe(2);
      expect(files[0].branchCoverage!.total).toBe(2);
      expect(files[0].branchCoverage!.percentage).toBe(100);
    });

    it("handles file with only missing branches (no executed)", () => {
      const report = JSON.stringify({
        files: {
          "test.py": {
            executed_lines: [],
            missing_lines: [1, 2],
            summary: {
              covered_lines: 0,
              num_statements: 2,
              percent_covered: 0,
            },
            missing_branches: [[1, 2]],
          },
        },
      });
      const files = coveragepy.parse(report, "/project");
      expect(files[0].branchCoverage!.covered).toBe(0);
      expect(files[0].branchCoverage!.total).toBe(1);
      expect(files[0].branchCoverage!.percentage).toBe(0);
    });

    it("handles non-consecutive missing lines correctly", () => {
      const report = JSON.stringify({
        files: {
          "test.py": {
            executed_lines: [2, 4],
            missing_lines: [1, 3, 5],
            summary: {
              covered_lines: 2,
              num_statements: 5,
              percent_covered: 40,
            },
          },
        },
      });
      const files = coveragepy.parse(report, "/project");
      // Each line should be its own range
      expect(files[0].uncoveredLines.length).toBe(3);
      expect(files[0].uncoveredLines[0]).toEqual({ start: 1, end: 1 });
      expect(files[0].uncoveredLines[1]).toEqual({ start: 3, end: 3 });
      expect(files[0].uncoveredLines[2]).toEqual({ start: 5, end: 5 });
    });

    it("handles unsorted missing lines", () => {
      const report = JSON.stringify({
        files: {
          "test.py": {
            executed_lines: [],
            missing_lines: [5, 1, 3, 2, 4],
            summary: {
              covered_lines: 0,
              num_statements: 5,
              percent_covered: 0,
            },
          },
        },
      });
      const files = coveragepy.parse(report, "/project");
      // Should sort and merge into single range 1-5
      expect(files[0].uncoveredLines.length).toBe(1);
      expect(files[0].uncoveredLines[0]).toEqual({ start: 1, end: 5 });
    });
  });
});
