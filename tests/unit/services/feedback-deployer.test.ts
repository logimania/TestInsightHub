/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, readFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import type { FeedbackFile } from "@shared/types/feedback";
import {
  deployFeedback,
  suggestGitignore,
} from "../../../src/main/services/feedback-generator/feedback-deployer";

function makeFeedbackFile(overrides: Partial<FeedbackFile> = {}): FeedbackFile {
  return {
    version: "1.0.0",
    generatedAt: "2026-01-01T00:00:00Z",
    projectRoot: "/project",
    coverageThreshold: 80,
    summary: {
      totalModules: 5,
      belowThreshold: 2,
      totalUncoveredFunctions: 10,
      overallCoverage: 65,
    },
    gaps: [],
    recommendations: [],
    ...overrides,
  };
}

describe("feedback-deployer", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "feedback-deployer-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("deployFeedback", () => {
    it("creates directory, writes file, and returns success", async () => {
      const feedback = makeFeedbackFile();
      const deployPath = join(tempDir, "output", "feedback.json");
      const result = await deployFeedback(feedback, deployPath);

      expect(result.success).toBe(true);
      expect(result.deployedPath).toBe(deployPath);
      expect(result.backupPath).toBeUndefined();

      // Verify file was actually written
      const content = await readFile(deployPath, "utf-8");
      expect(JSON.parse(content)).toEqual(feedback);
    });

    it("creates a backup when deploy path already exists", async () => {
      const feedback = makeFeedbackFile();
      const deployPath = join(tempDir, "feedback.json");

      // Create the initial file
      await writeFile(deployPath, '{"old": true}', "utf-8");

      const result = await deployFeedback(feedback, deployPath);

      expect(result.success).toBe(true);
      expect(result.backupPath).toBeDefined();
      expect(result.backupPath).toContain(".bak.json");

      // Verify backup was created
      expect(existsSync(result.backupPath!)).toBe(true);
      const backupContent = await readFile(result.backupPath!, "utf-8");
      expect(backupContent).toBe('{"old": true}');

      // Verify new file was written
      const content = await readFile(deployPath, "utf-8");
      expect(JSON.parse(content)).toEqual(feedback);
    });

    it("writes valid JSON content", async () => {
      const feedback = makeFeedbackFile({
        gaps: [
          {
            filePath: "src/main.ts",
            moduleName: "main",
            currentCoverage: 30,
            targetCoverage: 80,
            uncoveredLines: [{ start: 10, end: 20, functionName: "init" }],
            recommendedTestType: "unit",
            priority: "high",
            priorityScore: 90,
            complexity: 5,
            changeFrequency: 3,
          },
        ],
      });
      const deployPath = join(tempDir, "feedback.json");
      await deployFeedback(feedback, deployPath);

      const content = await readFile(deployPath, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed.gaps).toHaveLength(1);
      expect(parsed.gaps[0].filePath).toBe("src/main.ts");
    });

    it("handles non-json deploy path for backup extension", async () => {
      const feedback = makeFeedbackFile();
      const deployPath = join(tempDir, "feedback.txt");

      // Create the initial file so backup triggers
      await writeFile(deployPath, "old content", "utf-8");

      const result = await deployFeedback(feedback, deployPath);

      expect(result.success).toBe(true);
      expect(result.backupPath).toBeDefined();
      // Non-.json file backup should not have .json extension
      expect(result.backupPath!.endsWith(".json")).toBe(false);
      expect(result.backupPath).toContain(".bak");
    });

    it("creates nested directories as needed", async () => {
      const feedback = makeFeedbackFile();
      const deployPath = join(tempDir, "a", "b", "c", "feedback.json");
      const result = await deployFeedback(feedback, deployPath);

      expect(result.success).toBe(true);
      expect(existsSync(deployPath)).toBe(true);
    });
  });

  describe("suggestGitignore", () => {
    it("returns true when gitignore exists and does not contain dirName", async () => {
      await writeFile(
        join(tempDir, ".gitignore"),
        "node_modules\n.env\n",
        "utf-8",
      );

      const result = await suggestGitignore(tempDir, ".test-insight");
      expect(result).toBe(true);
    });

    it("returns false when gitignore already contains dirName", async () => {
      await writeFile(
        join(tempDir, ".gitignore"),
        "node_modules\n.test-insight\n",
        "utf-8",
      );

      const result = await suggestGitignore(tempDir, ".test-insight");
      expect(result).toBe(false);
    });

    it("returns false when gitignore does not exist", async () => {
      const result = await suggestGitignore(tempDir, ".test-insight");
      expect(result).toBe(false);
    });

    it("handles dirName appearing as substring", async () => {
      await writeFile(
        join(tempDir, ".gitignore"),
        ".test-insight-old\n",
        "utf-8",
      );
      // ".test-insight" IS a substring of ".test-insight-old", so it returns false
      const result = await suggestGitignore(tempDir, ".test-insight");
      expect(result).toBe(false);
    });
  });
});
