import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockHandle,
  mockShowOpenDialog,
  mockSend,
  mockParseProject,
  mockAddRecentProject,
  mockGenerateProjectId,
  mockSetProjectStructure,
} = vi.hoisted(() => ({
  mockHandle: vi.fn(),
  mockShowOpenDialog: vi.fn(),
  mockSend: vi.fn(),
  mockParseProject: vi.fn(),
  mockAddRecentProject: vi.fn(),
  mockGenerateProjectId: vi.fn().mockReturnValue("proj-abc"),
  mockSetProjectStructure: vi.fn(),
}));

vi.mock("electron", () => ({
  ipcMain: { handle: mockHandle },
  dialog: { showOpenDialog: mockShowOpenDialog },
  BrowserWindow: vi.fn(),
}));

vi.mock("../../../../src/main/services/project-parser", () => ({
  parseProject: mockParseProject,
}));

vi.mock("../../../../src/main/services/settings-manager", () => ({
  addRecentProject: mockAddRecentProject,
}));

vi.mock("../../../../src/main/utils/hash-utils", () => ({
  generateProjectId: mockGenerateProjectId,
}));

vi.mock("../../../../src/main/ipc/test-handlers", () => ({
  setProjectStructure: mockSetProjectStructure,
}));

import { registerProjectHandlers } from "../../../../src/main/ipc/project-handlers";

describe("project-handlers", () => {
  const mockMainWindow = {
    webContents: { send: mockSend },
  } as any;

  beforeEach(() => {
    mockHandle.mockReset();
    mockShowOpenDialog.mockReset();
    mockParseProject.mockReset();
    mockAddRecentProject.mockReset();
    mockSetProjectStructure.mockReset();
    mockSend.mockReset();
  });

  describe("registerProjectHandlers", () => {
    it("registers directory select and parse handlers", () => {
      registerProjectHandlers(mockMainWindow);
      const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
      expect(channels).toContain("project:select-directory");
      expect(channels).toContain("project:parse");
    });
  });

  describe("project:selectDirectory handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerProjectHandlers(mockMainWindow);
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "project:select-directory",
      )![1];
    });

    it("returns selected directory path", async () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ["/selected/project"],
      });

      const result = await handler({});
      expect(result).toBe("/selected/project");
    });

    it("returns null when dialog is canceled", async () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: [],
      });

      const result = await handler({});
      expect(result).toBeNull();
    });
  });

  describe("project:parse handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerProjectHandlers(mockMainWindow);
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "project:parse",
      )![1];
    });

    it("parses project and returns structure", async () => {
      const structure = {
        rootPath: "/project",
        modules: [
          {
            id: "src",
            name: "src",
            path: "src",
            files: [{}],
            fileCount: 1,
            functionCount: 2,
            totalLoc: 100,
            children: [],
          },
        ],
        edges: [],
        totalFiles: 1,
        totalLoc: 100,
        parsedAt: "2026-01-01",
        parseErrors: [],
      };
      mockParseProject.mockResolvedValue(structure);
      mockAddRecentProject.mockResolvedValue(undefined);

      const result = await handler({}, { rootPath: "/project" });

      expect(result).toEqual(structure);
      expect(mockSetProjectStructure).toHaveBeenCalledWith(structure);
      expect(mockAddRecentProject).toHaveBeenCalled();
    });

    it("throws when no source files found", async () => {
      mockParseProject.mockResolvedValue({
        rootPath: "/empty",
        modules: [],
        edges: [],
        totalFiles: 0,
        totalLoc: 0,
        parsedAt: "2026-01-01",
        parseErrors: [],
      });

      await expect(handler({}, { rootPath: "/empty" })).rejects.toThrow();
    });

    it("wraps unexpected errors in AppErrorImpl", async () => {
      mockParseProject.mockRejectedValue(new Error("filesystem error"));

      await expect(handler({}, { rootPath: "/bad" })).rejects.toThrow();
    });
  });
});
