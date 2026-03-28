import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockHandle,
  mockShowSaveDialog,
  mockWriteFile,
  mockClearProjectCache,
  mockClearAllCache,
} = vi.hoisted(() => ({
  mockHandle: vi.fn(),
  mockShowSaveDialog: vi.fn(),
  mockWriteFile: vi.fn(),
  mockClearProjectCache: vi.fn(),
  mockClearAllCache: vi.fn(),
}));

vi.mock("electron", () => ({
  ipcMain: { handle: mockHandle },
  dialog: { showSaveDialog: mockShowSaveDialog },
}));

vi.mock("fs/promises", () => ({
  default: { writeFile: mockWriteFile },
  writeFile: mockWriteFile,
}));

vi.mock("../../../../src/main/services/cache-manager", () => ({
  clearProjectCache: mockClearProjectCache,
  clearAllCache: mockClearAllCache,
  getCacheStats: vi.fn(),
}));

import { registerExportHandlers } from "../../../../src/main/ipc/export-handlers";

describe("export-handlers", () => {
  beforeEach(() => {
    mockHandle.mockReset();
    mockShowSaveDialog.mockReset();
    mockWriteFile.mockReset();
    mockClearProjectCache.mockReset();
    mockClearAllCache.mockReset();
  });

  describe("registerExportHandlers", () => {
    it("registers export:diagram and cache:clear handlers", () => {
      registerExportHandlers();
      const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
      expect(channels).toContain("export:diagram");
      expect(channels).toContain("cache:clear");
    });
  });

  describe("export:diagram handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerExportHandlers();
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "export:diagram",
      )![1];
    });

    it("saves SVG to specified path", async () => {
      mockWriteFile.mockResolvedValue(undefined);

      const result = await handler(
        {},
        {
          format: "svg",
          svgContent: "<svg><rect/></svg>",
          outputPath: "/out/diagram.svg",
        },
      );

      expect(result).toBe("/out/diagram.svg");
      expect(mockWriteFile).toHaveBeenCalledWith(
        "/out/diagram.svg",
        "<svg><rect/></svg>",
        "utf-8",
      );
    });

    it("decodes data URL SVG with charset encoding", async () => {
      mockWriteFile.mockResolvedValue(undefined);
      const svgRaw = "<svg><text>Hello</text></svg>";
      const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgRaw)}`;

      const result = await handler(
        {},
        {
          format: "svg",
          svgContent: encoded,
          outputPath: "/out/diagram.svg",
        },
      );

      expect(result).toBe("/out/diagram.svg");
      expect(mockWriteFile).toHaveBeenCalledWith(
        "/out/diagram.svg",
        svgRaw,
        "utf-8",
      );
    });

    it("decodes base64 SVG data URL", async () => {
      mockWriteFile.mockResolvedValue(undefined);
      const svgRaw = "<svg><rect/></svg>";
      const b64 = Buffer.from(svgRaw).toString("base64");
      const encoded = `data:image/svg+xml;base64,${b64}`;

      const result = await handler(
        {},
        {
          format: "svg",
          svgContent: encoded,
          outputPath: "/out/diagram.svg",
        },
      );

      expect(result).toBe("/out/diagram.svg");
      expect(mockWriteFile).toHaveBeenCalledWith(
        "/out/diagram.svg",
        svgRaw,
        "utf-8",
      );
    });

    it("saves PNG from base64 data URL", async () => {
      mockWriteFile.mockResolvedValue(undefined);
      const pngData = "data:image/png;base64,iVBORw0KGgo=";

      const result = await handler(
        {},
        {
          format: "png",
          svgContent: pngData,
          outputPath: "/out/diagram.png",
        },
      );

      expect(result).toBe("/out/diagram.png");
      expect(mockWriteFile).toHaveBeenCalledWith(
        "/out/diagram.png",
        expect.any(Buffer),
      );
    });

    it("shows save dialog when no outputPath provided", async () => {
      mockShowSaveDialog.mockResolvedValue({
        canceled: false,
        filePath: "/selected/diagram.svg",
      });
      mockWriteFile.mockResolvedValue(undefined);

      const result = await handler(
        {},
        {
          format: "svg",
          svgContent: "<svg/>",
        },
      );

      expect(mockShowSaveDialog).toHaveBeenCalled();
      expect(result).toBe("/selected/diagram.svg");
    });

    it("returns empty string when dialog canceled", async () => {
      mockShowSaveDialog.mockResolvedValue({
        canceled: true,
        filePath: undefined,
      });

      const result = await handler(
        {},
        {
          format: "svg",
          svgContent: "<svg/>",
        },
      );

      expect(result).toBe("");
      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });

  describe("cache:clear handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerExportHandlers();
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "cache:clear",
      )![1];
    });

    it("clears specific project cache", async () => {
      mockClearProjectCache.mockResolvedValue(undefined);

      await handler({}, "project-123");

      expect(mockClearProjectCache).toHaveBeenCalledWith("project-123");
      expect(mockClearAllCache).not.toHaveBeenCalled();
    });

    it("clears all cache when no projectId", async () => {
      mockClearAllCache.mockResolvedValue(undefined);

      await handler({});

      expect(mockClearAllCache).toHaveBeenCalled();
      expect(mockClearProjectCache).not.toHaveBeenCalled();
    });
  });
});
