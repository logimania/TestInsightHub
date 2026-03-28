import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCoverageStore } from "../../../../src/renderer/stores/coverage-store";
import type { ModuleNode, ParsedFile } from "@shared/types/project";
import type {
  FileCoverage,
  CoverageMetric,
  NormalizedCoverage,
} from "@shared/types/coverage";

// Mock window.api
const mockLoadCoverage = vi.fn();
vi.stubGlobal("window", {
  api: {
    coverage: { load: mockLoadCoverage },
  },
});

// --- Helpers ---

function makeMetric(covered: number, total: number): CoverageMetric {
  return {
    covered,
    total,
    percentage: total > 0 ? (covered / total) * 100 : 0,
  };
}

function makeFileCoverage(
  filePath: string,
  linePct: number,
  branchPct: number | null = null,
  fnPct: number = linePct,
): FileCoverage {
  return {
    filePath,
    lineCoverage: makeMetric(linePct, 100),
    branchCoverage: branchPct !== null ? makeMetric(branchPct, 100) : null,
    functionCoverage: makeMetric(fnPct, 100),
    uncoveredLines: [],
    uncoveredFunctions: [],
    coveredByTests: [],
  };
}

function makeParsedFile(path: string): ParsedFile {
  return {
    path,
    language: "typescript",
    loc: 100,
    functions: [{ name: "fn", startLine: 1, endLine: 10, complexity: 3 }],
    imports: [],
  };
}

function makeModuleNode(id: string, filePaths: string[]): ModuleNode {
  return {
    id,
    name: id.split("/").pop() ?? id,
    path: id,
    files: filePaths.map((p) => makeParsedFile(p)),
    fileCount: filePaths.length,
    functionCount: filePaths.length,
    totalLoc: filePaths.length * 100,
    children: [],
  };
}

describe("useCoverageStore", () => {
  beforeEach(() => {
    useCoverageStore.getState().reset();
    mockLoadCoverage.mockReset();
  });

  describe("initial state", () => {
    it("has default values", () => {
      const state = useCoverageStore.getState();
      expect(state.normalizedCoverage).toBeNull();
      expect(state.moduleCoverages).toEqual([]);
      expect(state.coverageMode).toBe("line");
      expect(state.testTypeFilter).toBe("all");
      expect(state.isLoading).toBe(false);
    });
  });

  describe("loadCoverage", () => {
    it("loads coverage from API", async () => {
      const coverage: NormalizedCoverage = {
        reportFormat: "istanbul",
        files: [makeFileCoverage("src/a.ts", 80)],
        generatedAt: new Date().toISOString(),
      };
      mockLoadCoverage.mockResolvedValue(coverage);

      await useCoverageStore.getState().loadCoverage("/path/to/report");

      const state = useCoverageStore.getState();
      expect(state.normalizedCoverage).toEqual(coverage);
      expect(state.isLoading).toBe(false);
      expect(mockLoadCoverage).toHaveBeenCalledWith({
        reportPath: "/path/to/report",
        autoDetect: false,
      });
    });

    it("auto-detects when no path provided", async () => {
      mockLoadCoverage.mockResolvedValue({
        reportFormat: "istanbul",
        files: [],
        generatedAt: new Date().toISOString(),
      });

      await useCoverageStore.getState().loadCoverage();

      expect(mockLoadCoverage).toHaveBeenCalledWith({
        reportPath: undefined,
        autoDetect: true,
      });
    });

    it("resets loading state on error", async () => {
      mockLoadCoverage.mockRejectedValue(new Error("not found"));

      await expect(
        useCoverageStore.getState().loadCoverage("/bad/path"),
      ).rejects.toThrow("not found");

      expect(useCoverageStore.getState().isLoading).toBe(false);
    });
  });

  describe("setCoverageMode", () => {
    it("updates mode and recalculates color levels", () => {
      // First compute module coverages
      const coverage: NormalizedCoverage = {
        reportFormat: "istanbul",
        files: [makeFileCoverage("src/a.ts", 90, 30, 60)],
        generatedAt: new Date().toISOString(),
      };
      useCoverageStore.setState({ normalizedCoverage: coverage });

      const modules = [makeModuleNode("src", ["src/a.ts"])];
      useCoverageStore.getState().computeModuleCoverages(modules);

      // Line mode should show green (90%)
      expect(useCoverageStore.getState().moduleCoverages[0].colorLevel).toBe(
        "green",
      );

      // Switch to branch mode - should show red (30%)
      useCoverageStore.getState().setCoverageMode("branch");
      expect(useCoverageStore.getState().coverageMode).toBe("branch");
      expect(useCoverageStore.getState().moduleCoverages[0].colorLevel).toBe(
        "red",
      );

      // Switch to function mode - should show yellow (60%)
      useCoverageStore.getState().setCoverageMode("function");
      expect(useCoverageStore.getState().coverageMode).toBe("function");
      expect(useCoverageStore.getState().moduleCoverages[0].colorLevel).toBe(
        "yellow",
      );
    });
  });

  describe("setTestTypeFilter", () => {
    it("updates filter", () => {
      useCoverageStore.getState().setTestTypeFilter("unit");
      expect(useCoverageStore.getState().testTypeFilter).toBe("unit");

      useCoverageStore.getState().setTestTypeFilter("all");
      expect(useCoverageStore.getState().testTypeFilter).toBe("all");
    });
  });

  describe("computeModuleCoverages", () => {
    it("aggregates file coverage by module", () => {
      const coverage: NormalizedCoverage = {
        reportFormat: "istanbul",
        files: [
          makeFileCoverage("src/api/a.ts", 80),
          makeFileCoverage("src/api/b.ts", 60),
          makeFileCoverage("src/lib/c.ts", 95),
        ],
        generatedAt: new Date().toISOString(),
      };
      useCoverageStore.setState({ normalizedCoverage: coverage });

      const modules = [
        makeModuleNode("src/api", ["src/api/a.ts", "src/api/b.ts"]),
        makeModuleNode("src/lib", ["src/lib/c.ts"]),
      ];

      useCoverageStore.getState().computeModuleCoverages(modules);

      const mc = useCoverageStore.getState().moduleCoverages;
      expect(mc.length).toBe(2);

      // src/api: 80+60 covered out of 200 total = 70%
      const apiMod = mc.find((m) => m.moduleId === "src/api");
      expect(apiMod).toBeDefined();
      expect(apiMod!.lineCoverage.covered).toBe(140);
      expect(apiMod!.lineCoverage.total).toBe(200);
      expect(apiMod!.colorLevel).toBe("yellow");

      // src/lib: 95%
      const libMod = mc.find((m) => m.moduleId === "src/lib");
      expect(libMod).toBeDefined();
      expect(libMod!.colorLevel).toBe("green");
    });

    it("marks modules with no matching files as grey", () => {
      const coverage: NormalizedCoverage = {
        reportFormat: "istanbul",
        files: [],
        generatedAt: new Date().toISOString(),
      };
      useCoverageStore.setState({ normalizedCoverage: coverage });

      const modules = [makeModuleNode("src/orphan", ["src/orphan/x.ts"])];
      useCoverageStore.getState().computeModuleCoverages(modules);

      const mc = useCoverageStore.getState().moduleCoverages;
      expect(mc[0].colorLevel).toBe("grey");
      expect(mc[0].files).toEqual([]);
    });

    it("returns empty when no normalizedCoverage", () => {
      useCoverageStore
        .getState()
        .computeModuleCoverages([makeModuleNode("src", ["src/a.ts"])]);
      expect(useCoverageStore.getState().moduleCoverages).toEqual([]);
    });

    it("determines color correctly for all thresholds", () => {
      const files = [
        makeFileCoverage("src/a.ts", 90), // green (>=80)
        makeFileCoverage("src/b.ts", 60), // yellow (>=50)
        makeFileCoverage("src/c.ts", 20), // red (>0)
        makeFileCoverage("src/d.ts", 0), // grey (0)
      ];
      const coverage: NormalizedCoverage = {
        reportFormat: "istanbul",
        files,
        generatedAt: new Date().toISOString(),
      };
      useCoverageStore.setState({ normalizedCoverage: coverage });

      const modules = files.map((f) =>
        makeModuleNode(f.filePath.replace(/\/[^/]+$/, ""), [f.filePath]),
      );
      // Need unique module IDs
      const uniqueModules = files.map((f, i) =>
        makeModuleNode(`mod${i}`, [f.filePath]),
      );

      useCoverageStore.getState().computeModuleCoverages(uniqueModules);

      const mc = useCoverageStore.getState().moduleCoverages;
      expect(mc[0].colorLevel).toBe("green");
      expect(mc[1].colorLevel).toBe("yellow");
      expect(mc[2].colorLevel).toBe("red");
      expect(mc[3].colorLevel).toBe("grey");
    });

    it("sums branch coverage when available", () => {
      const coverage: NormalizedCoverage = {
        reportFormat: "istanbul",
        files: [
          makeFileCoverage("src/a.ts", 80, 70),
          makeFileCoverage("src/b.ts", 60, 50),
        ],
        generatedAt: new Date().toISOString(),
      };
      useCoverageStore.setState({ normalizedCoverage: coverage });

      const modules = [makeModuleNode("src", ["src/a.ts", "src/b.ts"])];
      useCoverageStore.getState().computeModuleCoverages(modules);

      const mc = useCoverageStore.getState().moduleCoverages;
      expect(mc[0].branchCoverage).not.toBeNull();
      expect(mc[0].branchCoverage!.covered).toBe(120);
      expect(mc[0].branchCoverage!.total).toBe(200);
    });
  });

  describe("reset", () => {
    it("clears all state to defaults", () => {
      useCoverageStore.setState({
        normalizedCoverage: {
          reportFormat: "istanbul",
          files: [],
          generatedAt: "",
        },
        coverageMode: "branch",
        testTypeFilter: "unit",
        isLoading: true,
      });

      useCoverageStore.getState().reset();

      const state = useCoverageStore.getState();
      expect(state.normalizedCoverage).toBeNull();
      expect(state.moduleCoverages).toEqual([]);
      expect(state.coverageMode).toBe("line");
      expect(state.testTypeFilter).toBe("all");
      expect(state.isLoading).toBe(false);
    });
  });
});
