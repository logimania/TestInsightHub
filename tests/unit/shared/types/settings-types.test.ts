import { describe, it, expect } from "vitest";
import type {
  GlobalSettings,
  ProjectSettings,
  ColorThresholds,
  PathMapping,
  RecentProject,
  WindowState,
} from "../../../../src/shared/types/settings";

describe("shared/types/settings", () => {
  it("GlobalSettings structure is valid", () => {
    const settings: GlobalSettings = {
      theme: "dark",
      locale: "ja",
      maxCacheSizeBytes: 500 * 1024 * 1024,
      defaultCoverageThreshold: 80,
      defaultColorThresholds: { green: 80, yellow: 50 },
      defaultPriorityWeights: {
        coverageGapWeight: 0.4,
        complexityWeight: 0.3,
        changeFreqWeight: 0.3,
      },
    };
    expect(settings.theme).toBe("dark");
    expect(settings.locale).toBe("ja");
  });

  it("GlobalSettings supports light theme and en locale", () => {
    const settings: GlobalSettings = {
      theme: "light",
      locale: "en",
      maxCacheSizeBytes: 100,
      defaultCoverageThreshold: 70,
      defaultColorThresholds: { green: 80, yellow: 50 },
      defaultPriorityWeights: {
        coverageGapWeight: 0.5,
        complexityWeight: 0.3,
        changeFreqWeight: 0.2,
      },
    };
    expect(settings.theme).toBe("light");
    expect(settings.locale).toBe("en");
  });

  it("ProjectSettings structure is complete", () => {
    const project: ProjectSettings = {
      projectId: "proj-123",
      projectName: "My Project",
      rootPath: "/project",
      testRootPath: "/project/tests",
      coverageReportPath: "/project/coverage/lcov.info",
      coverageThreshold: 80,
      colorThresholds: { green: 80, yellow: 50 },
      excludePatterns: ["*.test.ts"],
      pathMappings: [{ sourcePrefix: "src/", reportPrefix: "lib/" }],
      priorityWeights: {
        coverageGapWeight: 0.4,
        complexityWeight: 0.3,
        changeFreqWeight: 0.3,
      },
      lastOpenedAt: "2026-01-01",
    };
    expect(project.projectId).toBe("proj-123");
    expect(project.testRootPath).toBe("/project/tests");
  });

  it("ProjectSettings supports null optional paths", () => {
    const project: ProjectSettings = {
      projectId: "proj-456",
      projectName: "No Tests",
      rootPath: "/project2",
      testRootPath: null,
      coverageReportPath: null,
      coverageThreshold: 80,
      colorThresholds: { green: 80, yellow: 50 },
      excludePatterns: [],
      pathMappings: [],
      priorityWeights: {
        coverageGapWeight: 0.4,
        complexityWeight: 0.3,
        changeFreqWeight: 0.3,
      },
      lastOpenedAt: "2026-01-01",
    };
    expect(project.testRootPath).toBeNull();
    expect(project.coverageReportPath).toBeNull();
  });

  it("ColorThresholds defines green and yellow boundaries", () => {
    const thresholds: ColorThresholds = { green: 80, yellow: 50 };
    expect(thresholds.green).toBeGreaterThan(thresholds.yellow);
  });

  it("PathMapping maps source to report prefixes", () => {
    const mapping: PathMapping = {
      sourcePrefix: "src/",
      reportPrefix: "dist/",
    };
    expect(mapping.sourcePrefix).toBe("src/");
  });

  it("RecentProject tracks minimal project info", () => {
    const recent: RecentProject = {
      projectId: "proj-789",
      projectName: "Recent",
      rootPath: "/recent",
      lastOpenedAt: "2026-03-28",
    };
    expect(recent.projectId).toBe("proj-789");
  });

  it("WindowState tracks window position and size", () => {
    const state: WindowState = {
      width: 1280,
      height: 800,
      x: 100,
      y: 200,
      isMaximized: false,
    };
    expect(state.width).toBe(1280);
    expect(state.isMaximized).toBe(false);
  });

  it("WindowState supports undefined position", () => {
    const state: WindowState = {
      width: 1920,
      height: 1080,
      x: undefined,
      y: undefined,
      isMaximized: true,
    };
    expect(state.x).toBeUndefined();
    expect(state.y).toBeUndefined();
  });
});
