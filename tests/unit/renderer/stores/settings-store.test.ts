import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore } from "../../../../src/renderer/stores/settings-store";

const mockLoadGlobal = vi.fn();
const mockSaveGlobal = vi.fn();
const mockLoadProject = vi.fn();
const mockSaveProject = vi.fn();
const mockLoadRecentProjects = vi.fn();

vi.stubGlobal("window", {
  api: {
    settings: {
      loadGlobal: mockLoadGlobal,
      saveGlobal: mockSaveGlobal,
      loadProject: mockLoadProject,
      saveProject: mockSaveProject,
      loadRecentProjects: mockLoadRecentProjects,
    },
  },
});

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      globalSettings: null,
      projectSettings: null,
      recentProjects: [],
    });
    vi.clearAllMocks();
  });

  it("has correct initial state", () => {
    const state = useSettingsStore.getState();
    expect(state.globalSettings).toBeNull();
    expect(state.projectSettings).toBeNull();
    expect(state.recentProjects).toEqual([]);
  });

  it("loadGlobalSettings fetches and sets settings", async () => {
    const settings = {
      coverageThreshold: 80,
      colorThresholds: { green: 80, yellow: 50 },
      locale: "ja" as const,
      theme: "dark" as const,
    };
    mockLoadGlobal.mockResolvedValue(settings);

    await useSettingsStore.getState().loadGlobalSettings();
    expect(useSettingsStore.getState().globalSettings).toEqual(settings);
  });

  it("saveGlobalSettings calls API and updates state", async () => {
    const settings = {
      coverageThreshold: 90,
      colorThresholds: { green: 90, yellow: 60 },
      locale: "en" as const,
      theme: "light" as const,
    };
    mockSaveGlobal.mockResolvedValue(undefined);

    await useSettingsStore.getState().saveGlobalSettings(settings);
    expect(mockSaveGlobal).toHaveBeenCalledWith(settings);
    expect(useSettingsStore.getState().globalSettings).toEqual(settings);
  });

  it("loadProjectSettings fetches and sets project settings", async () => {
    const projectSettings = {
      projectId: "p1",
      coverageThreshold: 70,
      priorityWeights: {
        coverageGapWeight: 0.4,
        complexityWeight: 0.3,
        changeFreqWeight: 0.3,
      },
    };
    mockLoadProject.mockResolvedValue(projectSettings);

    await useSettingsStore.getState().loadProjectSettings("p1");
    expect(useSettingsStore.getState().projectSettings).toEqual(
      projectSettings,
    );
  });

  it("saveProjectSettings calls API and updates state", async () => {
    const projectSettings = {
      projectId: "p1",
      coverageThreshold: 70,
      priorityWeights: {
        coverageGapWeight: 0.4,
        complexityWeight: 0.3,
        changeFreqWeight: 0.3,
      },
    };
    mockSaveProject.mockResolvedValue(undefined);

    await useSettingsStore.getState().saveProjectSettings(projectSettings);
    expect(mockSaveProject).toHaveBeenCalledWith(projectSettings);
    expect(useSettingsStore.getState().projectSettings).toEqual(
      projectSettings,
    );
  });

  it("loadRecentProjects fetches and sets recent projects", async () => {
    const projects = [
      {
        projectId: "p1",
        projectName: "My App",
        rootPath: "/app",
        lastOpenedAt: "2026-01-01",
      },
    ];
    mockLoadRecentProjects.mockResolvedValue(projects);

    await useSettingsStore.getState().loadRecentProjects();
    expect(useSettingsStore.getState().recentProjects).toEqual(projects);
  });
});
