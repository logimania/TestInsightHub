import { describe, it, expect, vi } from "vitest";
import type { FileCoverage } from "@shared/types/coverage";
import type { PathMapping } from "@shared/types/settings";

// Mock all parsers
vi.mock(
  "../../../src/main/services/coverage-analyzer/parsers/istanbul-parser",
  () => ({
    parse: vi.fn(() => []),
  }),
);
vi.mock(
  "../../../src/main/services/coverage-analyzer/parsers/lcov-parser",
  () => ({
    parse: vi.fn(() => []),
  }),
);
vi.mock(
  "../../../src/main/services/coverage-analyzer/parsers/coveragepy-parser",
  () => ({
    parse: vi.fn(() => []),
  }),
);
vi.mock(
  "../../../src/main/services/coverage-analyzer/parsers/go-cover-parser",
  () => ({
    parse: vi.fn(() => []),
  }),
);
vi.mock(
  "../../../src/main/services/coverage-analyzer/parsers/llvm-cov-parser",
  () => ({
    parse: vi.fn(() => []),
  }),
);

import {
  parseReport,
  applyPathMappings,
  matchWithSourceFiles,
} from "../../../src/main/services/coverage-analyzer/normalizer";

import * as istanbul from "../../../src/main/services/coverage-analyzer/parsers/istanbul-parser";
import * as lcov from "../../../src/main/services/coverage-analyzer/parsers/lcov-parser";
import * as coveragepy from "../../../src/main/services/coverage-analyzer/parsers/coveragepy-parser";
import * as goCover from "../../../src/main/services/coverage-analyzer/parsers/go-cover-parser";
import * as llvmCov from "../../../src/main/services/coverage-analyzer/parsers/llvm-cov-parser";

function makeFileCoverage(filePath: string): FileCoverage {
  return {
    filePath,
    lineCoverage: { covered: 10, total: 20, percentage: 50 },
    branchCoverage: null,
    functionCoverage: { covered: 3, total: 5, percentage: 60 },
    uncoveredLines: [],
    uncoveredFunctions: [],
    coveredByTests: [],
  };
}

describe("normalizer", () => {
  describe("parseReport", () => {
    it("delegates to istanbul parser for istanbul format", () => {
      const mockFiles = [makeFileCoverage("src/a.ts")];
      vi.mocked(istanbul.parse).mockReturnValue(mockFiles);

      const result = parseReport("{}", "istanbul", "/root");
      expect(istanbul.parse).toHaveBeenCalledWith("{}", "/root");
      expect(result).toEqual(mockFiles);
    });

    it("delegates to lcov parser for lcov format", () => {
      vi.mocked(lcov.parse).mockReturnValue([]);
      parseReport("SF:...", "lcov", "/root");
      expect(lcov.parse).toHaveBeenCalledWith("SF:...", "/root");
    });

    it("delegates to coveragepy parser for coveragepy format", () => {
      vi.mocked(coveragepy.parse).mockReturnValue([]);
      parseReport("{}", "coveragepy", "/root");
      expect(coveragepy.parse).toHaveBeenCalledWith("{}", "/root");
    });

    it("delegates to go-cover parser for go-coverprofile format", () => {
      vi.mocked(goCover.parse).mockReturnValue([]);
      parseReport("mode: set", "go-coverprofile", "/root");
      expect(goCover.parse).toHaveBeenCalledWith("mode: set", "/root");
    });

    it("delegates to llvm-cov parser for llvm-cov format", () => {
      vi.mocked(llvmCov.parse).mockReturnValue([]);
      parseReport("{}", "llvm-cov", "/root");
      expect(llvmCov.parse).toHaveBeenCalledWith("{}", "/root");
    });

    it("returns empty array for unknown format", () => {
      const result = parseReport("data", "unknown-format" as any, "/root");
      expect(result).toEqual([]);
    });
  });

  describe("applyPathMappings", () => {
    it("returns files unchanged when no mappings provided", () => {
      const files = [
        makeFileCoverage("src/a.ts"),
        makeFileCoverage("src/b.ts"),
      ];
      const result = applyPathMappings(files, []);
      expect(result).toBe(files); // same reference
    });

    it("applies prefix mapping to matching files", () => {
      const files = [
        makeFileCoverage("/build/src/a.ts"),
        makeFileCoverage("/build/src/b.ts"),
      ];
      const mappings: PathMapping[] = [
        { reportPrefix: "/build/src/", sourcePrefix: "src/" },
      ];

      const result = applyPathMappings(files, mappings);
      expect(result[0].filePath).toBe("src/a.ts");
      expect(result[1].filePath).toBe("src/b.ts");
    });

    it("does not modify files that do not match any mapping", () => {
      const files = [makeFileCoverage("lib/x.ts")];
      const mappings: PathMapping[] = [
        { reportPrefix: "/build/", sourcePrefix: "src/" },
      ];

      const result = applyPathMappings(files, mappings);
      expect(result[0].filePath).toBe("lib/x.ts");
    });

    it("applies only the first matching mapping", () => {
      const files = [makeFileCoverage("/a/b/c.ts")];
      const mappings: PathMapping[] = [
        { reportPrefix: "/a/", sourcePrefix: "x/" },
        { reportPrefix: "/a/b/", sourcePrefix: "y/" },
      ];

      const result = applyPathMappings(files, mappings);
      // First mapping matches, so /a/ -> x/, result: x/b/c.ts
      expect(result[0].filePath).toBe("x/b/c.ts");
    });

    it("preserves other file coverage properties", () => {
      const original = makeFileCoverage("/build/src/a.ts");
      const mappings: PathMapping[] = [
        { reportPrefix: "/build/src/", sourcePrefix: "src/" },
      ];

      const result = applyPathMappings([original], mappings);
      expect(result[0].lineCoverage).toEqual(original.lineCoverage);
      expect(result[0].functionCoverage).toEqual(original.functionCoverage);
    });
  });

  describe("matchWithSourceFiles", () => {
    it("matches coverage files with source files", () => {
      const coverageFiles = [
        makeFileCoverage("src/a.ts"),
        makeFileCoverage("src/b.ts"),
        makeFileCoverage("src/c.ts"),
      ];
      const sourceFiles = ["src/a.ts", "src/b.ts", "src/d.ts"];

      const result = matchWithSourceFiles(coverageFiles, sourceFiles);

      expect(result.matched).toHaveLength(2);
      expect(result.matched.map((f) => f.filePath)).toEqual([
        "src/a.ts",
        "src/b.ts",
      ]);
      expect(result.unmatched).toEqual(["src/c.ts"]);
      expect(result.matchRate).toBeCloseTo(66.67, 0);
    });

    it("returns 100% match rate when all files match", () => {
      const coverageFiles = [makeFileCoverage("src/a.ts")];
      const sourceFiles = ["src/a.ts"];

      const result = matchWithSourceFiles(coverageFiles, sourceFiles);
      expect(result.matchRate).toBe(100);
      expect(result.unmatched).toHaveLength(0);
    });

    it("returns 0% match rate when no files match", () => {
      const coverageFiles = [makeFileCoverage("src/a.ts")];
      const sourceFiles = ["src/b.ts"];

      const result = matchWithSourceFiles(coverageFiles, sourceFiles);
      expect(result.matchRate).toBe(0);
      expect(result.matched).toHaveLength(0);
      expect(result.unmatched).toEqual(["src/a.ts"]);
    });

    it("returns 100% match rate when coverage files are empty", () => {
      const result = matchWithSourceFiles([], ["src/a.ts"]);
      expect(result.matchRate).toBe(100);
      expect(result.matched).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);
    });

    it("handles empty source files list", () => {
      const coverageFiles = [makeFileCoverage("src/a.ts")];
      const result = matchWithSourceFiles(coverageFiles, []);

      expect(result.matched).toHaveLength(0);
      expect(result.unmatched).toEqual(["src/a.ts"]);
      expect(result.matchRate).toBe(0);
    });
  });
});
