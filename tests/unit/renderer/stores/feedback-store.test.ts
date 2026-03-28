import { describe, it, expect, beforeEach, vi } from "vitest";
import { useFeedbackStore } from "../../../../src/renderer/stores/feedback-store";
import type {
  ProjectStructure,
  ModuleNode,
  ParsedFile,
} from "@shared/types/project";
import type {
  ModuleCoverage,
  FileCoverage,
  CoverageMetric,
} from "@shared/types/coverage";

// Mock window.api for deploy
const mockDeploy = vi.fn().mockResolvedValue({ success: true });
vi.stubGlobal("window", {
  api: {
    feedback: { deploy: mockDeploy },
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

function makeParsedFile(
  path: string,
  fns: string[] = [],
  loc = 100,
): ParsedFile {
  return {
    path,
    language: "typescript",
    loc,
    functions: fns.map((name, i) => ({
      name,
      startLine: i * 10 + 1,
      endLine: i * 10 + 9,
      complexity: 5,
    })),
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

function makeFileCoverage(
  filePath: string,
  linePct: number,
  uncoveredFns: string[] = [],
): FileCoverage {
  return {
    filePath,
    lineCoverage: makeMetric(linePct, 100),
    branchCoverage: null,
    functionCoverage: makeMetric(linePct, 100),
    uncoveredLines:
      linePct < 100 ? [{ start: 10, end: 20, functionName: "someFn" }] : [],
    uncoveredFunctions: uncoveredFns,
    coveredByTests: [],
  };
}

function makeModuleCoverage(
  moduleId: string,
  files: FileCoverage[],
  linePct: number,
): ModuleCoverage {
  return {
    moduleId,
    lineCoverage: makeMetric(linePct, 100),
    branchCoverage: null,
    functionCoverage: makeMetric(linePct, 100),
    files,
    colorLevel:
      linePct >= 80
        ? "green"
        : linePct >= 50
          ? "yellow"
          : linePct > 0
            ? "red"
            : "grey",
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

describe("useFeedbackStore", () => {
  beforeEach(() => {
    useFeedbackStore.getState().reset();
    mockDeploy.mockClear();
  });

  describe("initial state", () => {
    it("has null currentFeedback", () => {
      const state = useFeedbackStore.getState();
      expect(state.currentFeedback).toBeNull();
      expect(state.enrichedGaps).toEqual([]);
      expect(state.comparison).toBeNull();
      expect(state.history).toEqual([]);
      expect(state.isGenerating).toBe(false);
    });
  });

  describe("generateFromData", () => {
    it("generates feedback from project structure and coverage", () => {
      const parsedFile = makeParsedFile("src/repo/user-repo.ts", [
        "findUser",
        "createUser",
      ]);
      const structure = makeStructure([makeModule("src/repo", [parsedFile])]);
      const moduleCoverages: ModuleCoverage[] = [
        makeModuleCoverage(
          "src/repo",
          [makeFileCoverage("src/repo/user-repo.ts", 40, ["findUser"])],
          40,
        ),
      ];

      useFeedbackStore
        .getState()
        .generateFromData(structure, moduleCoverages, 80);

      const state = useFeedbackStore.getState();
      expect(state.currentFeedback).not.toBeNull();
      expect(state.currentFeedback!.version).toBe("1.2.0");
      expect(state.currentFeedback!.coverageThreshold).toBe(80);
      expect(state.currentFeedback!.gaps.length).toBeGreaterThan(0);
      expect(state.enrichedGaps.length).toBeGreaterThan(0);
      expect(state.history.length).toBe(1);
      expect(state.isGenerating).toBe(false);
    });

    it("produces enrichedGaps with correct priority scoring", () => {
      const parsedFile = makeParsedFile(
        "src/api/handler.ts",
        ["handleRequest"],
        50,
      );
      const structure = makeStructure([makeModule("src/api", [parsedFile])]);
      const moduleCoverages: ModuleCoverage[] = [
        makeModuleCoverage(
          "src/api",
          [makeFileCoverage("src/api/handler.ts", 20, ["handleRequest"])],
          20,
        ),
      ];

      useFeedbackStore
        .getState()
        .generateFromData(structure, moduleCoverages, 80);

      const enriched = useFeedbackStore.getState().enrichedGaps;
      expect(enriched.length).toBe(1);
      expect(enriched[0].filePath).toBe("src/api/handler.ts");
      expect(enriched[0].priorityScore).toBeGreaterThan(0);
      expect(enriched[0].priority).toBeDefined();
      expect(enriched[0].recommendedTestType).toBe("integration");
    });

    it("creates comparison when called twice", () => {
      const parsedFile = makeParsedFile("src/lib/utils.ts", ["parseData"]);
      const structure = makeStructure([makeModule("src/lib", [parsedFile])]);
      const moduleCoverages1: ModuleCoverage[] = [
        makeModuleCoverage(
          "src/lib",
          [makeFileCoverage("src/lib/utils.ts", 30, ["parseData"])],
          30,
        ),
      ];
      const moduleCoverages2: ModuleCoverage[] = [
        makeModuleCoverage(
          "src/lib",
          [makeFileCoverage("src/lib/utils.ts", 50, ["parseData"])],
          50,
        ),
      ];

      useFeedbackStore
        .getState()
        .generateFromData(structure, moduleCoverages1, 80);
      useFeedbackStore
        .getState()
        .generateFromData(structure, moduleCoverages2, 80);

      const state = useFeedbackStore.getState();
      expect(state.comparison).not.toBeNull();
      expect(state.comparison!.improved.length).toBe(1);
      expect(state.comparison!.improved[0].currentCoverage).toBeGreaterThan(
        state.comparison!.improved[0].previousCoverage,
      );
      expect(state.history.length).toBe(2);
    });

    it("handles empty module coverages", () => {
      const structure = makeStructure([]);
      useFeedbackStore.getState().generateFromData(structure, [], 80);

      const state = useFeedbackStore.getState();
      expect(state.currentFeedback).not.toBeNull();
      expect(state.currentFeedback!.gaps.length).toBe(0);
      expect(state.enrichedGaps.length).toBe(0);
    });

    it("handles grey modules by generating entries from source", () => {
      const parsedFile = makeParsedFile(
        "src/utils/helpers.ts",
        ["formatDate", "parseUrl"],
        80,
      );
      const structure = makeStructure([makeModule("src/utils", [parsedFile])]);
      const moduleCoverages: ModuleCoverage[] = [
        {
          moduleId: "src/utils",
          lineCoverage: makeMetric(0, 0),
          branchCoverage: null,
          functionCoverage: makeMetric(0, 0),
          files: [],
          colorLevel: "grey",
        },
      ];

      useFeedbackStore
        .getState()
        .generateFromData(structure, moduleCoverages, 80);

      const enriched = useFeedbackStore.getState().enrichedGaps;
      expect(enriched.length).toBe(1);
      expect(enriched[0].filePath).toBe("src/utils/helpers.ts");
      expect(enriched[0].uncoveredFunctions).toContain("formatDate");
      expect(enriched[0].uncoveredFunctions).toContain("parseUrl");
    });

    it("filters control keywords from uncovered function names", () => {
      const parsedFile = makeParsedFile("src/lib/logic.ts", ["processItem"]);
      const structure = makeStructure([makeModule("src/lib", [parsedFile])]);
      const moduleCoverages: ModuleCoverage[] = [
        makeModuleCoverage(
          "src/lib",
          [
            {
              filePath: "src/lib/logic.ts",
              lineCoverage: makeMetric(20, 100),
              branchCoverage: null,
              functionCoverage: makeMetric(20, 100),
              uncoveredLines: [{ start: 1, end: 10 }],
              uncoveredFunctions: ["if", "processItem", "return", "class"],
              coveredByTests: [],
            },
          ],
          20,
        ),
      ];

      useFeedbackStore
        .getState()
        .generateFromData(structure, moduleCoverages, 80);

      const enriched = useFeedbackStore.getState().enrichedGaps;
      expect(enriched[0].uncoveredFunctions).toContain("processItem");
      expect(enriched[0].uncoveredFunctions).not.toContain("if");
      expect(enriched[0].uncoveredFunctions).not.toContain("return");
      expect(enriched[0].uncoveredFunctions).not.toContain("class");
    });

    it("infers test type based on file path", () => {
      const files: ParsedFile[] = [
        makeParsedFile("src/renderer/pages/home.tsx", ["HomePage"]),
        makeParsedFile("src/main/ipc/handler.ts", ["handleReq"]),
        makeParsedFile("src/shared/utils.ts", ["formatDate"]),
      ];
      const modules = files.map((f) =>
        makeModule(f.path.split("/").slice(0, -1).join("/"), [f]),
      );
      const structure = makeStructure(modules);

      const moduleCoverages = modules.map((m, i) =>
        makeModuleCoverage(
          m.id,
          [makeFileCoverage(files[i].path, 10, ["fn"])],
          10,
        ),
      );

      useFeedbackStore
        .getState()
        .generateFromData(structure, moduleCoverages, 80);

      const enriched = useFeedbackStore.getState().enrichedGaps;
      const pageGap = enriched.find((g) => g.filePath.includes("pages"));
      const ipcGap = enriched.find((g) => g.filePath.includes("ipc"));
      const utilGap = enriched.find((g) => g.filePath.includes("utils"));

      expect(pageGap?.recommendedTestType).toBe("e2e");
      expect(ipcGap?.recommendedTestType).toBe("integration");
      expect(utilGap?.recommendedTestType).toBe("unit");
    });

    it("generates quality analysis for files", () => {
      const parsedFile = makeParsedFile("src/lib/calc.ts", ["add", "subtract"]);
      const structure = makeStructure([makeModule("src/lib", [parsedFile])]);

      // File with no tests
      const moduleCoverages: ModuleCoverage[] = [
        makeModuleCoverage(
          "src/lib",
          [
            {
              filePath: "src/lib/calc.ts",
              lineCoverage: makeMetric(0, 100),
              branchCoverage: null,
              functionCoverage: makeMetric(0, 100),
              uncoveredLines: [{ start: 1, end: 50 }],
              uncoveredFunctions: ["add", "subtract"],
              coveredByTests: [],
            },
          ],
          0,
        ),
      ];

      useFeedbackStore
        .getState()
        .generateFromData(structure, moduleCoverages, 80);

      const enriched = useFeedbackStore.getState().enrichedGaps;
      expect(enriched[0].qualityLevel).toBe("none");
      expect(enriched[0].qualityScore).toBe(0);
      expect(enriched[0].qualitySuggestions.length).toBeGreaterThan(0);
    });

    it("generates test scenarios for uncovered functions", () => {
      const parsedFile = makeParsedFile("src/lib/calc.ts", ["compute"]);
      const structure = makeStructure([makeModule("src/lib", [parsedFile])]);
      const moduleCoverages: ModuleCoverage[] = [
        makeModuleCoverage(
          "src/lib",
          [makeFileCoverage("src/lib/calc.ts", 10, ["compute"])],
          10,
        ),
      ];

      useFeedbackStore
        .getState()
        .generateFromData(structure, moduleCoverages, 80);

      const enriched = useFeedbackStore.getState().enrichedGaps;
      expect(enriched[0].requiredScenarios.length).toBeGreaterThan(0);
      const normalScenario = enriched[0].requiredScenarios.find(
        (s) => s.type === "normal",
      );
      expect(normalScenario).toBeDefined();
      expect(normalScenario!.description).toContain("compute");
    });

    it("sorts enriched gaps by priority score descending", () => {
      const files = [
        makeParsedFile("src/a.ts", ["fn1"], 200),
        makeParsedFile("src/b.ts", ["fn2"], 50),
      ];
      // fn1 has higher complexity → higher priority
      files[0] = {
        ...files[0],
        functions: [
          { name: "fn1", startLine: 1, endLine: 100, complexity: 50 },
        ],
      };
      files[1] = {
        ...files[1],
        functions: [{ name: "fn2", startLine: 1, endLine: 30, complexity: 2 }],
      };
      const structure = makeStructure([makeModule("src", files)]);
      const moduleCoverages: ModuleCoverage[] = [
        makeModuleCoverage(
          "src",
          [
            makeFileCoverage("src/a.ts", 10, ["fn1"]),
            makeFileCoverage("src/b.ts", 10, ["fn2"]),
          ],
          10,
        ),
      ];

      useFeedbackStore
        .getState()
        .generateFromData(structure, moduleCoverages, 80);

      const enriched = useFeedbackStore.getState().enrichedGaps;
      expect(enriched.length).toBe(2);
      expect(enriched[0].priorityScore).toBeGreaterThanOrEqual(
        enriched[1].priorityScore,
      );
    });
  });

  describe("deploy", () => {
    it("calls window.api.feedback.deploy with current feedback", async () => {
      const parsedFile = makeParsedFile("src/a.ts", ["fn"]);
      const structure = makeStructure([makeModule("src", [parsedFile])]);
      const mc: ModuleCoverage[] = [
        makeModuleCoverage(
          "src",
          [makeFileCoverage("src/a.ts", 20, ["fn"])],
          20,
        ),
      ];

      useFeedbackStore.getState().generateFromData(structure, mc, 80);
      await useFeedbackStore.getState().deploy("/output/feedback.json");

      expect(mockDeploy).toHaveBeenCalledWith({
        feedbackFile: useFeedbackStore.getState().currentFeedback,
        deployPath: "/output/feedback.json",
      });
    });

    it("does nothing when no current feedback", async () => {
      await useFeedbackStore.getState().deploy("/output/feedback.json");
      expect(mockDeploy).not.toHaveBeenCalled();
    });
  });

  describe("reset", () => {
    it("clears all state", () => {
      const parsedFile = makeParsedFile("src/a.ts", ["fn"]);
      const structure = makeStructure([makeModule("src", [parsedFile])]);
      const mc: ModuleCoverage[] = [
        makeModuleCoverage(
          "src",
          [makeFileCoverage("src/a.ts", 20, ["fn"])],
          20,
        ),
      ];

      useFeedbackStore.getState().generateFromData(structure, mc, 80);
      expect(useFeedbackStore.getState().currentFeedback).not.toBeNull();

      useFeedbackStore.getState().reset();
      const state = useFeedbackStore.getState();
      expect(state.currentFeedback).toBeNull();
      expect(state.enrichedGaps).toEqual([]);
      expect(state.comparison).toBeNull();
      expect(state.history).toEqual([]);
      expect(state.isGenerating).toBe(false);
    });
  });
});
