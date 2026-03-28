import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockHandle,
  mockLoadGlobalSettings,
  mockSaveGlobalSettings,
  mockLoadProjectSettings,
  mockSaveProjectSettings,
  mockLoadRecentProjects,
} = vi.hoisted(() => ({
  mockHandle: vi.fn(),
  mockLoadGlobalSettings: vi.fn().mockResolvedValue({}),
  mockSaveGlobalSettings: vi.fn().mockResolvedValue(undefined),
  mockLoadProjectSettings: vi.fn().mockResolvedValue(null),
  mockSaveProjectSettings: vi.fn().mockResolvedValue(undefined),
  mockLoadRecentProjects: vi.fn().mockResolvedValue([]),
}));

vi.mock("electron", () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock("../../../../src/main/services/settings-manager", () => ({
  loadGlobalSettings: mockLoadGlobalSettings,
  saveGlobalSettings: mockSaveGlobalSettings,
  loadProjectSettings: mockLoadProjectSettings,
  saveProjectSettings: mockSaveProjectSettings,
  loadRecentProjects: mockLoadRecentProjects,
}));

import { registerSettingsHandlers } from "../../../../src/main/ipc/settings-handlers";

function getHandler(channel: string): Function {
  const call = mockHandle.mock.calls.find(
    (c: unknown[]) => c[0] === channel,
  );
  if (!call) {
    throw new Error(`No handler registered for channel: ${channel}`);
  }
  return call[1] as Function;
}

describe("registerSettingsHandlers", () => {
  beforeEach(() => {
    mockHandle.mockReset();
    mockLoadGlobalSettings.mockReset().mockResolvedValue({});
    mockSaveGlobalSettings.mockReset().mockResolvedValue(undefined);
    mockLoadProjectSettings.mockReset().mockResolvedValue(null);
    mockSaveProjectSettings.mockReset().mockResolvedValue(undefined);
    mockLoadRecentProjects.mockReset().mockResolvedValue([]);
  });

  it("registers five IPC handlers", () => {
    registerSettingsHandlers();
    expect(mockHandle).toHaveBeenCalledTimes(5);
  });

  it("registers handler for settings:load-global", () => {
    registerSettingsHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain("settings:load-global");
  });

  it("registers handler for settings:save-global", () => {
    registerSettingsHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain("settings:save-global");
  });

  it("registers handler for settings:load-project", () => {
    registerSettingsHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain("settings:load-project");
  });

  it("registers handler for settings:save-project", () => {
    registerSettingsHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain("settings:save-project");
  });

  it("registers handler for recent-projects:load", () => {
    registerSettingsHandlers();
    const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
    expect(channels).toContain("recent-projects:load");
  });

  describe("settings:load-global handler", () => {
    it("calls loadGlobalSettings and returns result", async () => {
      const globalSettings = { theme: "dark", locale: "en" };
      mockLoadGlobalSettings.mockResolvedValue(globalSettings);

      registerSettingsHandlers();
      const handler = getHandler("settings:load-global");
      const result = await handler();

      expect(mockLoadGlobalSettings).toHaveBeenCalled();
      expect(result).toEqual(globalSettings);
    });
  });

  describe("settings:save-global handler", () => {
    it("calls saveGlobalSettings with the provided settings", async () => {
      const settings = { theme: "light", locale: "ja" };

      registerSettingsHandlers();
      const handler = getHandler("settings:save-global");
      await handler({}, settings);

      expect(mockSaveGlobalSettings).toHaveBeenCalledWith(settings);
    });
  });

  describe("settings:load-project handler", () => {
    it("calls loadProjectSettings with the project ID", async () => {
      const projectSettings = { projectId: "abc", projectName: "Test" };
      mockLoadProjectSettings.mockResolvedValue(projectSettings);

      registerSettingsHandlers();
      const handler = getHandler("settings:load-project");
      const result = await handler({}, "abc");

      expect(mockLoadProjectSettings).toHaveBeenCalledWith("abc");
      expect(result).toEqual(projectSettings);
    });
  });

  describe("settings:save-project handler", () => {
    it("calls saveProjectSettings with the provided settings", async () => {
      const settings = { projectId: "abc", projectName: "Test" };

      registerSettingsHandlers();
      const handler = getHandler("settings:save-project");
      await handler({}, settings);

      expect(mockSaveProjectSettings).toHaveBeenCalledWith(settings);
    });
  });

  describe("recent-projects:load handler", () => {
    it("calls loadRecentProjects and returns result", async () => {
      const projects = [
        { projectId: "p1", projectName: "Proj1", rootPath: "/path", lastOpenedAt: "2026-01-01" },
      ];
      mockLoadRecentProjects.mockResolvedValue(projects);

      registerSettingsHandlers();
      const handler = getHandler("recent-projects:load");
      const result = await handler();

      expect(mockLoadRecentProjects).toHaveBeenCalled();
      expect(result).toEqual(projects);
    });
  });
});
