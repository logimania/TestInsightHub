import { describe, it, expect } from "vitest";
import {
  globalSettingsSchema,
  projectSettingsSchema,
} from "@shared/schemas/settings-schema";
import { feedbackFileSchema } from "@shared/schemas/feedback-schema";

describe("Settings Schemas", () => {
  it("validates a correct global settings object", () => {
    const valid = {
      theme: "dark",
      locale: "ja",
      maxCacheSizeBytes: 1000000,
      defaultCoverageThreshold: 80,
      defaultColorThresholds: { green: 80, yellow: 50 },
      defaultPriorityWeights: {
        coverageGapWeight: 0.4,
        complexityWeight: 0.3,
        changeFreqWeight: 0.3,
      },
    };
    expect(globalSettingsSchema.parse(valid)).toEqual(valid);
  });

  it("rejects an invalid theme", () => {
    const invalid = {
      theme: "blue",
      locale: "ja",
      maxCacheSizeBytes: 1000,
      defaultCoverageThreshold: 80,
      defaultColorThresholds: { green: 80, yellow: 50 },
      defaultPriorityWeights: {
        coverageGapWeight: 0.4,
        complexityWeight: 0.3,
        changeFreqWeight: 0.3,
      },
    };
    expect(() => globalSettingsSchema.parse(invalid)).toThrow();
  });

  it("rejects coverage threshold over 100", () => {
    const invalid = {
      theme: "light",
      locale: "en",
      maxCacheSizeBytes: 1000,
      defaultCoverageThreshold: 150,
      defaultColorThresholds: { green: 80, yellow: 50 },
      defaultPriorityWeights: {
        coverageGapWeight: 0.4,
        complexityWeight: 0.3,
        changeFreqWeight: 0.3,
      },
    };
    expect(() => globalSettingsSchema.parse(invalid)).toThrow();
  });

  it("validates a correct project settings object", () => {
    const valid = {
      projectId: "abc123",
      projectName: "my-project",
      rootPath: "/path/to/project",
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
      lastOpenedAt: "2026-03-22T10:00:00Z",
    };
    expect(projectSettingsSchema.parse(valid)).toEqual(valid);
  });
});

describe("Feedback Schema", () => {
  it("validates a correct feedback file", () => {
    const valid = {
      version: "1.0.0",
      generatedAt: "2026-03-22T10:00:00Z",
      projectRoot: "/path/to/project",
      coverageThreshold: 80,
      summary: {
        totalModules: 10,
        belowThreshold: 3,
        totalUncoveredFunctions: 15,
        overallCoverage: 65.5,
      },
      gaps: [
        {
          filePath: "src/repo.ts",
          moduleName: "repo",
          currentCoverage: 40,
          targetCoverage: 80,
          uncoveredLines: [{ start: 10, end: 20, functionName: "findAll" }],
          recommendedTestType: "unit",
          priority: "high",
          priorityScore: 85,
          complexity: 10,
          changeFrequency: 5,
        },
      ],
      recommendations: [
        {
          type: "unit",
          targetFile: "src/repo.ts",
          suggestedTestFile: "tests/repo.test.ts",
          functions: ["findAll"],
          description: "Add unit tests for findAll",
        },
      ],
    };
    expect(feedbackFileSchema.parse(valid)).toEqual(valid);
  });

  it("rejects invalid priority", () => {
    const invalid = {
      version: "1.0.0",
      generatedAt: "2026-03-22T10:00:00Z",
      projectRoot: "/",
      coverageThreshold: 80,
      summary: {
        totalModules: 1,
        belowThreshold: 1,
        totalUncoveredFunctions: 1,
        overallCoverage: 50,
      },
      gaps: [
        {
          filePath: "a.ts",
          moduleName: "a",
          currentCoverage: 30,
          targetCoverage: 80,
          uncoveredLines: [],
          recommendedTestType: "unit",
          priority: "critical", // invalid
          priorityScore: 90,
          complexity: 5,
          changeFrequency: 3,
        },
      ],
      recommendations: [],
    };
    expect(() => feedbackFileSchema.parse(invalid)).toThrow();
  });
});
