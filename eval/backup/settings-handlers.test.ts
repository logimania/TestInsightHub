import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockHandle,
  mockLoadGlobal,
  mockSaveGlobal,
  mockLoadProject,
  mockSaveProject,
  mockLoadRecent,
} = vi.hoisted(() => ({
  mockHandle: vi.fn(),
  mockLoadGlobal: vi.fn().mockResolvedValue({}),
  mockSaveGlobal: vi.fn().mockResolvedValue(undefined),
  mockLoadProject: vi.fn().mockResolvedValue(null),
  mockSaveProject: vi.fn().mockResolvedValue(undefined),
  mockLoadRecent: vi.fn().mockResolvedValue([]),
}));

vi.mock("electron", () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock("../../../../src/main/services/settings-manager", () => ({
  loadGlobalSettings: mockLoadGlobal,
  saveGlobalSettings: mockSaveGlobal,
  loadProjectSettings: mockLoadProject,
  saveProjectSettings: mockSaveProject,
  loadRecentProjects: mockLoadRecent,
}));

import { registerSettingsHandlers } from "../../../../src/main/ipc/settings-handlers";

describe("settings-handlers", () => {
  beforeEach(() => {
    mockHandle.mockReset();
    mockLoadGlobal.mockReset().mockResolvedValue({});
    mockSaveGlobal.mockReset().mockResolvedValue(undefined);
    mockLoadProject.mockReset().mockResolvedValue(null);
    mockSaveProject.mockReset().mockResolvedValue(undefined);
    mockLoadRecent.mockReset().mockResolvedValue([]);
  });

  describe("registerSettingsHandlers", () => {
    it("registers all 5 settings handlers", () => {
      registerSettingsHandlers();
      const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
      expect(channels).toContain("settings:load-global");
      expect(channels).toContain("settings:save-global");
      expect(channels).toContain("settings:load-project");
      expect(channels).toContain("settings:save-project");
      expect(channels).toContain("recent-projects:load");
    });
  });

  describe("settings:load-global handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerSettingsHandlers();
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "settings:load-global",
      )![1];
    });

    it("delegates to loadGlobalSettings", async () => {
      const settings = { theme: "dark", language: "ja" };
      mockLoadGlobal.mockResolvedValue(settings);

      const result = await handler();
      expect(result).toEqual(settings);
      expect(mockLoadGlobal).toHaveBeenCalled();
    });
  });

  describe("settings:save-global handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerSettingsHandlers();
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "settings:save-global",
      )![1];
    });

    it("delegates to saveGlobalSettings", async () => {
      const settings = { theme: "light", language: "en" };
      await handler({}, settings);
      expect(mockSaveGlobal).toHaveBeenCalledWith(settings);
    });
  });

  describe("settings:load-project handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerSettingsHandlers();
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "settings:load-project",
      )![1];
    });

    it("delegates to loadProjectSettings with projectId", async () => {
      const projectSettings = { exclude: ["node_modules"] };
      mockLoadProject.mockResolvedValue(projectSettings);

      const result = await handler({}, "proj-123");
      expect(result).toEqual(projectSettings);
      expect(mockLoadProject).toHaveBeenCalledWith("proj-123");
    });
  });

  describe("settings:save-project handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerSettingsHandlers();
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "settings:save-project",
      )![1];
    });

    it("delegates to saveProjectSettings", async () => {
      const settings = { projectId: "proj-123", exclude: [] };
      await handler({}, settings);
      expect(mockSaveProject).toHaveBeenCalledWith(settings);
    });
  });

  describe("recent-projects:load handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerSettingsHandlers();
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "recent-projects:load",
      )![1];
    });

    it("delegates to loadRecentProjects", async () => {
      const projects = [{ id: "proj-1", path: "/path" }];
      mockLoadRecent.mockResolvedValue(projects);

      const result = await handler();
      expect(result).toEqual(projects);
      expect(mockLoadRecent).toHaveBeenCalled();
    });
  });
});
