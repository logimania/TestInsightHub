import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockHandle,
  mockOn,
  mockSend,
  mockRunAllTestsWithCoverage,
  mockAnalyzeTestQuality,
  mockMapTestsToCoverage,
} = vi.hoisted(() => ({
  mockHandle: vi.fn(),
  mockOn: vi.fn(),
  mockSend: vi.fn(),
  mockRunAllTestsWithCoverage: vi.fn(),
  mockAnalyzeTestQuality: vi.fn(),
  mockMapTestsToCoverage: vi.fn(),
}));

vi.mock("electron", () => ({
  ipcMain: { handle: mockHandle, on: mockOn },
  BrowserWindow: vi.fn(),
}));

vi.mock("../../../../src/main/services/test-runner", () => ({
  runAllTestsWithCoverage: mockRunAllTestsWithCoverage,
}));

vi.mock("../../../../src/main/services/test-quality-analyzer", () => ({
  analyzeTestQuality: mockAnalyzeTestQuality,
}));

vi.mock(
  "../../../../src/main/services/coverage-analyzer/test-source-mapper",
  () => ({
    mapTestsToCoverage: mockMapTestsToCoverage,
  }),
);

import {
  registerTestHandlers,
  setProjectStructure,
} from "../../../../src/main/ipc/test-handlers";

describe("test-handlers", () => {
  const mockMainWindow = {
    webContents: { send: mockSend },
  } as any;

  beforeEach(() => {
    mockHandle.mockReset();
    mockOn.mockReset();
    mockSend.mockReset();
    mockRunAllTestsWithCoverage.mockReset();
    mockAnalyzeTestQuality.mockReset();
    mockMapTestsToCoverage.mockReset();
  });

  describe("registerTestHandlers", () => {
    it("registers test:run and test:quality-analyze handlers", () => {
      registerTestHandlers(mockMainWindow);
      const handleChannels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
      expect(handleChannels).toContain("test:run");
      expect(handleChannels).toContain("test:quality-analyze");
    });

    it("registers project:parse-result listener", () => {
      registerTestHandlers(mockMainWindow);
      const onChannels = mockOn.mock.calls.map((c: unknown[]) => c[0]);
      expect(onChannels).toContain("project:parse-result");
    });
  });

  describe("test:run handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerTestHandlers(mockMainWindow);
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "test:run",
      )![1];
    });

    it("returns coverage when tests produce coverage", async () => {
      const coverage = {
        reportFormat: "istanbul",
        files: [{ filePath: "src/a.ts" }],
        generatedAt: "2026-01-01",
      };
      mockRunAllTestsWithCoverage.mockResolvedValue({
        coverageResult: { coverage },
      });

      const result = await handler(
        {},
        {
          rootPath: "/project",
          customCommand: "npm test",
        },
      );

      expect(result).toEqual(coverage);
    });

    it("returns null when no coverage result", async () => {
      mockRunAllTestsWithCoverage.mockResolvedValue({
        coverageResult: null,
      });

      const result = await handler({}, { rootPath: "/project" });
      expect(result).toBeNull();
    });

    it("returns null when coverageResult has no coverage", async () => {
      mockRunAllTestsWithCoverage.mockResolvedValue({
        coverageResult: { coverage: null },
      });

      const result = await handler({}, { rootPath: "/project" });
      expect(result).toBeNull();
    });

    it("maps tests to coverage when project structure exists", async () => {
      const structure = {
        rootPath: "/project",
        modules: [
          {
            id: "src",
            name: "src",
            path: "src",
            files: [
              {
                path: "src/a.ts",
                language: "typescript",
                loc: 50,
                functions: [],
                imports: [],
              },
            ],
            fileCount: 1,
            functionCount: 0,
            totalLoc: 50,
            children: [],
          },
        ],
        edges: [],
        totalFiles: 1,
        totalLoc: 50,
        parsedAt: "2026-01-01",
        parseErrors: [],
      };
      setProjectStructure(structure);

      const files = [{ filePath: "src/a.ts" }];
      const coverage = {
        reportFormat: "istanbul",
        files,
        generatedAt: "2026-01-01",
      };
      mockRunAllTestsWithCoverage.mockResolvedValue({
        coverageResult: { coverage },
      });
      mockMapTestsToCoverage.mockReturnValue(files);

      const result = await handler({}, { rootPath: "/project" });

      expect(mockMapTestsToCoverage).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("test:quality-analyze handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerTestHandlers(mockMainWindow);
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "test:quality-analyze",
      )![1];
    });

    it("calls analyzeTestQuality with provided paths", async () => {
      const qualityResult = { score: 85, issues: [] };
      mockAnalyzeTestQuality.mockResolvedValue(qualityResult);

      const result = await handler(
        {},
        {
          testFilePaths: ["tests/a.test.ts"],
          rootPath: "/project",
        },
      );

      expect(result).toEqual(qualityResult);
      expect(mockAnalyzeTestQuality).toHaveBeenCalledWith(
        ["tests/a.test.ts"],
        "/project",
      );
    });
  });

  describe("setProjectStructure", () => {
    it("is a function that can be called without error", () => {
      expect(() =>
        setProjectStructure({
          rootPath: "/test",
          modules: [],
          edges: [],
          totalFiles: 0,
          totalLoc: 0,
          parsedAt: "",
          parseErrors: [],
        }),
      ).not.toThrow();
    });
  });
});
