import { describe, it, expect } from "vitest";
import {
  APP_NAME,
  DEFAULT_COVERAGE_THRESHOLD,
  DEFAULT_COLOR_THRESHOLDS,
  DEFAULT_PRIORITY_WEIGHTS,
  EXCLUDED_DIRS,
  TEST_FILE_PATTERNS,
  COVERAGE_AUTO_DETECT_PATHS,
} from "@shared/constants";

describe("App Constants", () => {
  it("APP_NAME is defined", () => {
    expect(APP_NAME).toBe("Test Insight Hub");
  });

  it("DEFAULT_COVERAGE_THRESHOLD is 80", () => {
    expect(DEFAULT_COVERAGE_THRESHOLD).toBe(80);
  });

  it("DEFAULT_COLOR_THRESHOLDS has green and yellow", () => {
    expect(DEFAULT_COLOR_THRESHOLDS.green).toBe(80);
    expect(DEFAULT_COLOR_THRESHOLDS.yellow).toBe(50);
    expect(DEFAULT_COLOR_THRESHOLDS.green).toBeGreaterThan(
      DEFAULT_COLOR_THRESHOLDS.yellow,
    );
  });

  it("DEFAULT_PRIORITY_WEIGHTS sum to 1.0", () => {
    const sum =
      DEFAULT_PRIORITY_WEIGHTS.coverageGapWeight +
      DEFAULT_PRIORITY_WEIGHTS.complexityWeight +
      DEFAULT_PRIORITY_WEIGHTS.changeFreqWeight;
    expect(sum).toBeCloseTo(1.0);
  });

  it("EXCLUDED_DIRS includes common directories", () => {
    expect(EXCLUDED_DIRS).toContain("node_modules");
    expect(EXCLUDED_DIRS).toContain("dist");
    expect(EXCLUDED_DIRS).toContain(".git");
  });

  it("TEST_FILE_PATTERNS match test files correctly", () => {
    const testFiles = [
      "foo.test.ts",
      "bar.spec.tsx",
      "test_baz.py",
      "qux_test.go",
    ];
    const nonTestFiles = ["index.ts", "main.py", "handler.go"];

    for (const file of testFiles) {
      const matches = TEST_FILE_PATTERNS.some((p) => p.test(file));
      expect(matches).toBe(true);
    }

    for (const file of nonTestFiles) {
      const matches = TEST_FILE_PATTERNS.some((p) => p.test(file));
      expect(matches).toBe(false);
    }
  });

  it("COVERAGE_AUTO_DETECT_PATHS is non-empty", () => {
    expect(COVERAGE_AUTO_DETECT_PATHS.length).toBeGreaterThan(0);
  });
});
