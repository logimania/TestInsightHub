import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockHandle, mockDeployFeedback } = vi.hoisted(() => ({
  mockHandle: vi.fn(),
  mockDeployFeedback: vi.fn(),
}));

vi.mock("electron", () => ({
  ipcMain: { handle: mockHandle },
}));

vi.mock(
  "../../../../src/main/services/feedback-generator/feedback-deployer",
  () => ({
    deployFeedback: mockDeployFeedback,
  }),
);

vi.mock(
  "../../../../src/main/services/feedback-generator/cycle-tracker",
  () => ({
    compareFeedback: vi.fn(),
  }),
);

vi.mock("../../../../src/main/services/feedback-generator", () => ({
  generateFeedback: vi.fn(),
}));

import {
  registerFeedbackHandlers,
  setLastProjectRoot,
} from "../../../../src/main/ipc/feedback-handlers";

describe("feedback-handlers", () => {
  beforeEach(() => {
    mockHandle.mockReset();
    mockDeployFeedback.mockReset();
  });

  describe("registerFeedbackHandlers", () => {
    it("registers all feedback channels", () => {
      registerFeedbackHandlers();
      const channels = mockHandle.mock.calls.map((c: unknown[]) => c[0]);
      expect(channels).toContain("feedback:generate");
      expect(channels).toContain("feedback:deploy");
      expect(channels).toContain("feedback:history");
      expect(channels).toContain("feedback:compare");
    });
  });

  describe("feedback:generate handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerFeedbackHandlers();
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "feedback:generate",
      )![1];
    });

    it("throws descriptive error (not yet fully integrated)", async () => {
      await expect(handler({}, {})).rejects.toThrow();
    });
  });

  describe("feedback:deploy handler", () => {
    let handler: Function;

    beforeEach(() => {
      registerFeedbackHandlers();
      handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "feedback:deploy",
      )![1];
    });

    it("deploys feedback to specified path", async () => {
      mockDeployFeedback.mockResolvedValue({
        success: true,
        backupPath: "/backup/feedback.json.bak",
      });

      const feedbackFile = {
        version: "1.0.0",
        generatedAt: "2026-01-01",
        projectRoot: "/project",
        coverageThreshold: 80,
        summary: {
          totalModules: 1,
          belowThreshold: 0,
          totalUncoveredFunctions: 0,
          overallCoverage: 90,
        },
        gaps: [],
        recommendations: [],
      };

      const result = await handler(
        {},
        {
          feedbackFile,
          deployPath: "/output/feedback.json",
        },
      );

      expect(result).toEqual({
        success: true,
        backupPath: "/backup/feedback.json.bak",
      });
      expect(mockDeployFeedback).toHaveBeenCalledWith(
        feedbackFile,
        "/output/feedback.json",
      );
    });

    it("uses default deploy path when not specified", async () => {
      setLastProjectRoot("/my/project");

      mockDeployFeedback.mockResolvedValue({
        success: true,
        backupPath: null,
      });

      const feedbackFile = {
        version: "1.0.0",
        generatedAt: "2026-01-01",
        projectRoot: "/project",
        coverageThreshold: 80,
        summary: {
          totalModules: 0,
          belowThreshold: 0,
          totalUncoveredFunctions: 0,
          overallCoverage: 0,
        },
        gaps: [],
        recommendations: [],
      };

      await handler({}, { feedbackFile, deployPath: "" });

      const deployPath = mockDeployFeedback.mock.calls[0][1];
      expect(deployPath).toContain(".test-insight");
      expect(deployPath).toContain("feedback.json");
    });
  });

  describe("feedback:history handler", () => {
    it("returns empty array", async () => {
      registerFeedbackHandlers();
      const handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "feedback:history",
      )![1];

      const result = await handler({});
      expect(result).toEqual([]);
    });
  });

  describe("feedback:compare handler", () => {
    it("returns null", async () => {
      registerFeedbackHandlers();
      const handler = mockHandle.mock.calls.find(
        (c: unknown[]) => c[0] === "feedback:compare",
      )![1];

      const result = await handler({});
      expect(result).toBeNull();
    });
  });
});
