import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockHandle, mockShowOpenDialog, mockLoadCoverage } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
  mockShowOpenDialog: vi.fn(),
  mockLoadCoverage: vi.fn(),
}));

vi.mock("electron", () => ({
  ipcMain: { handle: mockHandle },
  dialog: { showOpenDialog: mockShowOpenDialog },
}));

vi.mock("../../../../src/main/services/coverage-analyzer", () => ({
  loadCoverage: mockLoadCoverage,
}));

import {
  registerCoverageHandlers,
  setLastRootPath,
} from "../../../../src/main/ipc/coverage-handlers";

describe("coverage-handlers", () => {
  beforeEach(() => {
    mockHandle.mockReset();
    mockShowOpenDialog.mockReset();
    mockLoadCoverage.mockReset();
  });

  describe("registerCoverageHandlers", () => {
    it("registers coverage:load handler", () => {
      registerCoverageHandlers();
      expect(mockHandle).toHaveBeenCalledWith(
        "coverage:load",
        expect.any(Function),
      );
    });
  });

  describe("coverage:load handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerCoverageHandlers();
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "coverage:load",
      )![1];
    });

    it("loads coverage with provided report path", async () => {
      const mockCoverage = { files: [], reportFormat: "istanbul" };
      mockLoadCoverage.mockResolvedValue({
        coverage: mockCoverage,
        matchRate: 100,
        unmatchedFiles: [],
      });

      const result = await handler(
        {},
        {
          reportPath: "/path/to/coverage.json",
          autoDetect: false,
        },
      );

      expect(mockLoadCoverage).toHaveBeenCalledWith({
        rootPath: "",
        reportPath: "/path/to/coverage.json",
        autoDetect: false,
      });
      expect(result).toEqual(mockCoverage);
    });

    it("uses lastRootPath when set", async () => {
      setLastRootPath("/my/project");

      mockLoadCoverage.mockResolvedValue({
        coverage: { files: [] },
        matchRate: 100,
        unmatchedFiles: [],
      });

      await handler({}, { reportPath: "/report.json", autoDetect: false });

      expect(mockLoadCoverage).toHaveBeenCalledWith(
        expect.objectContaining({ rootPath: "/my/project" }),
      );
    });

    it("auto-detects when autoDetect is true", async () => {
      mockLoadCoverage.mockResolvedValue({
        coverage: { files: [] },
        matchRate: 100,
        unmatchedFiles: [],
      });

      await handler({}, { autoDetect: true });

      expect(mockLoadCoverage).toHaveBeenCalledWith(
        expect.objectContaining({ autoDetect: true }),
      );
      expect(mockShowOpenDialog).not.toHaveBeenCalled();
    });

    it("shows dialog when no path and not auto-detect", async () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ["/selected/report.json"],
      });
      mockLoadCoverage.mockResolvedValue({
        coverage: { files: [] },
        matchRate: 100,
        unmatchedFiles: [],
      });

      await handler({}, { autoDetect: false });

      expect(mockShowOpenDialog).toHaveBeenCalled();
      expect(mockLoadCoverage).toHaveBeenCalledWith(
        expect.objectContaining({ reportPath: "/selected/report.json" }),
      );
    });

    it("throws when dialog is canceled", async () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: [],
      });

      await expect(handler({}, { autoDetect: false })).rejects.toThrow();
    });

    it("returns coverage even when match rate is low", async () => {
      const mockCoverage = { files: [{ filePath: "a.ts" }] };
      mockLoadCoverage.mockResolvedValue({
        coverage: mockCoverage,
        matchRate: 30,
        unmatchedFiles: ["b.ts", "c.ts"],
      });

      const result = await handler(
        {},
        {
          reportPath: "/report.json",
          autoDetect: false,
        },
      );

      expect(result).toEqual(mockCoverage);
    });
  });
});
