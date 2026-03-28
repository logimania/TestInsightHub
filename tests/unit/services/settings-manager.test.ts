/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFile, writeFile, mkdir } from "fs/promises";

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => "/mock/userData"),
  },
}));

vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
  return {
    ...actual,
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  };
});

const {
  loadGlobalSettings,
  saveGlobalSettings,
  loadProjectSettings,
  saveProjectSettings,
  loadRecentProjects,
  addRecentProject,
} = await import("../../../src/main/services/settings-manager");
import type {
  GlobalSettings,
  ProjectSettings,
  RecentProject,
} from "@shared/types/settings";
import {
  DEFAULT_COVERAGE_THRESHOLD,
  DEFAULT_COLOR_THRESHOLDS,
  DEFAULT_PRIORITY_WEIGHTS,
  CACHE_MAX_TOTAL_SIZE_BYTES,
  RECENT_PROJECTS_MAX,
} from "@shared/constants";

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockMkdir = vi.mocked(mkdir);

beforeEach(() => {
  vi.clearAllMocks();
});

const DEFAULT_GLOBAL: GlobalSettings = {
  theme: "light",
  locale: "ja",
  maxCacheSizeBytes: CACHE_MAX_TOTAL_SIZE_BYTES,
  defaultCoverageThreshold: DEFAULT_COVERAGE_THRESHOLD,
  defaultColorThresholds: DEFAULT_COLOR_THRESHOLDS,
  defaultPriorityWeights: DEFAULT_PRIORITY_WEIGHTS,
};

describe("loadGlobalSettings", () => {
  it("returns saved settings when file exists", async () => {
    const saved: GlobalSettings = { ...DEFAULT_GLOBAL, theme: "dark" };
    mockReadFile.mockResolvedValueOnce(JSON.stringify(saved));

    const result = await loadGlobalSettings();

    expect(result.theme).toBe("dark");
  });

  it("returns default settings when file does not exist", async () => {
    mockReadFile.mockRejectedValueOnce(new Error("ENOENT"));

    const result = await loadGlobalSettings();

    expect(result).toEqual(DEFAULT_GLOBAL);
  });

  it("returns default settings when file contains invalid JSON", async () => {
    mockReadFile.mockResolvedValueOnce("not valid json");

    const result = await loadGlobalSettings();

    expect(result).toEqual(DEFAULT_GLOBAL);
  });
});

describe("saveGlobalSettings", () => {
  it("writes settings as formatted JSON", async () => {
    mockMkdir.mockResolvedValueOnce(undefined as any);
    mockWriteFile.mockResolvedValueOnce(undefined);

    const settings: GlobalSettings = { ...DEFAULT_GLOBAL, theme: "dark" };
    await saveGlobalSettings(settings);

    expect(mockMkdir).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining("settings.json"),
      JSON.stringify(settings, null, 2),
      "utf-8",
    );
  });
});

describe("loadProjectSettings", () => {
  it("returns project settings when file exists", async () => {
    const settings: ProjectSettings = {
      projectId: "proj1",
      projectName: "Test Project",
      rootPath: "/path/to/project",
      testRootPath: null,
      coverageReportPath: null,
      coverageThreshold: 80,
      colorThresholds: { green: 80, yellow: 50 },
      excludePatterns: [],
      pathMappings: [],
      priorityWeights: DEFAULT_PRIORITY_WEIGHTS,
      lastOpenedAt: "2026-01-01T00:00:00Z",
    };
    mockReadFile.mockResolvedValueOnce(JSON.stringify(settings));

    const result = await loadProjectSettings("proj1");

    expect(result).toEqual(settings);
  });

  it("returns null when file does not exist", async () => {
    mockReadFile.mockRejectedValueOnce(new Error("ENOENT"));

    const result = await loadProjectSettings("nonexistent");

    expect(result).toBeNull();
  });
});

describe("saveProjectSettings", () => {
  it("writes project settings to the correct path", async () => {
    mockMkdir.mockResolvedValueOnce(undefined as any);
    mockWriteFile.mockResolvedValueOnce(undefined);

    const settings: ProjectSettings = {
      projectId: "proj1",
      projectName: "Test",
      rootPath: "/test",
      testRootPath: null,
      coverageReportPath: null,
      coverageThreshold: 80,
      colorThresholds: { green: 80, yellow: 50 },
      excludePatterns: [],
      pathMappings: [],
      priorityWeights: DEFAULT_PRIORITY_WEIGHTS,
      lastOpenedAt: "2026-01-01T00:00:00Z",
    };

    await saveProjectSettings(settings);

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining("proj1"),
      expect.any(String),
      "utf-8",
    );
  });
});

describe("loadRecentProjects", () => {
  it("returns saved recent projects", async () => {
    const projects: RecentProject[] = [
      {
        projectId: "p1",
        projectName: "P1",
        rootPath: "/p1",
        lastOpenedAt: "2026-01-01",
      },
    ];
    mockReadFile.mockResolvedValueOnce(JSON.stringify(projects));

    const result = await loadRecentProjects();

    expect(result).toEqual(projects);
  });

  it("returns empty array when file does not exist", async () => {
    mockReadFile.mockRejectedValueOnce(new Error("ENOENT"));

    const result = await loadRecentProjects();

    expect(result).toEqual([]);
  });
});

describe("addRecentProject", () => {
  it("adds a new project to the beginning of the list", async () => {
    const existing: RecentProject[] = [
      {
        projectId: "p1",
        projectName: "P1",
        rootPath: "/p1",
        lastOpenedAt: "2026-01-01",
      },
    ];
    // loadRecentProjects reads the file
    mockReadFile.mockResolvedValueOnce(JSON.stringify(existing));
    // writeJsonFile
    mockMkdir.mockResolvedValueOnce(undefined as any);
    mockWriteFile.mockResolvedValueOnce(undefined);

    const newProject: RecentProject = {
      projectId: "p2",
      projectName: "P2",
      rootPath: "/p2",
      lastOpenedAt: "2026-01-02",
    };
    await addRecentProject(newProject);

    const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
    expect(writtenData[0].projectId).toBe("p2");
    expect(writtenData[1].projectId).toBe("p1");
  });

  it("moves existing project to the top when re-added", async () => {
    const existing: RecentProject[] = [
      {
        projectId: "p1",
        projectName: "P1",
        rootPath: "/p1",
        lastOpenedAt: "2026-01-01",
      },
      {
        projectId: "p2",
        projectName: "P2",
        rootPath: "/p2",
        lastOpenedAt: "2026-01-02",
      },
    ];
    mockReadFile.mockResolvedValueOnce(JSON.stringify(existing));
    mockMkdir.mockResolvedValueOnce(undefined as any);
    mockWriteFile.mockResolvedValueOnce(undefined);

    const updated: RecentProject = {
      projectId: "p2",
      projectName: "P2 Updated",
      rootPath: "/p2",
      lastOpenedAt: "2026-01-03",
    };
    await addRecentProject(updated);

    const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
    expect(writtenData[0].projectId).toBe("p2");
    expect(writtenData[0].projectName).toBe("P2 Updated");
    expect(writtenData.length).toBe(2);
  });

  it("limits the list to RECENT_PROJECTS_MAX entries", async () => {
    const existing: RecentProject[] = Array.from(
      { length: RECENT_PROJECTS_MAX },
      (_, i) => ({
        projectId: `p${i}`,
        projectName: `P${i}`,
        rootPath: `/p${i}`,
        lastOpenedAt: "2026-01-01",
      }),
    );
    mockReadFile.mockResolvedValueOnce(JSON.stringify(existing));
    mockMkdir.mockResolvedValueOnce(undefined as any);
    mockWriteFile.mockResolvedValueOnce(undefined);

    const newProject: RecentProject = {
      projectId: "new",
      projectName: "New",
      rootPath: "/new",
      lastOpenedAt: "2026-01-02",
    };
    await addRecentProject(newProject);

    const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1] as string);
    expect(writtenData.length).toBe(RECENT_PROJECTS_MAX);
    expect(writtenData[0].projectId).toBe("new");
  });
});
