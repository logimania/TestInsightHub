import { describe, it, expect } from "vitest";
import { scorePriority } from "../../../src/main/services/feedback-generator/priority-scorer";
import type { CoverageGap } from "@shared/types/feedback";

function makeGap(
  filePath: string,
  current: number,
  target: number,
): CoverageGap {
  return {
    filePath,
    moduleName: "mod",
    currentCoverage: current,
    targetCoverage: target,
    uncoveredLines: [],
    recommendedTestType: "unit",
    priority: "medium",
    priorityScore: 0,
    complexity: 0,
    changeFrequency: 0,
  };
}

describe("scorePriority", () => {
  it("calculates priority score from 3 factors", () => {
    const gaps = [makeGap("a.ts", 20, 80)];
    const complexityMap = new Map([["a.ts", 15]]);
    const changeFreqMap = new Map([["a.ts", 50]]);

    const scored = scorePriority(gaps, complexityMap, changeFreqMap);

    expect(scored[0].priorityScore).toBeGreaterThan(0);
    expect(scored[0].priorityScore).toBeLessThanOrEqual(100);
    expect(scored[0].complexity).toBe(15);
    expect(scored[0].changeFrequency).toBe(50);
  });

  it("assigns high priority for high scores", () => {
    const gaps = [makeGap("a.ts", 0, 80)];
    const complexityMap = new Map([["a.ts", 90]]);
    const changeFreqMap = new Map([["a.ts", 90]]);

    const scored = scorePriority(gaps, complexityMap, changeFreqMap);
    expect(scored[0].priority).toBe("high");
  });

  it("assigns low priority for low scores", () => {
    const gaps = [makeGap("a.ts", 70, 80)];
    const complexityMap = new Map([["a.ts", 2]]);
    const changeFreqMap = new Map([["a.ts", 5]]);

    const scored = scorePriority(gaps, complexityMap, changeFreqMap);
    expect(scored[0].priority).toBe("low");
  });

  it("uses default values when maps are empty", () => {
    const gaps = [makeGap("a.ts", 30, 80)];
    const scored = scorePriority(gaps, new Map(), new Map());

    expect(scored[0].complexity).toBe(1);
    expect(scored[0].changeFrequency).toBe(0);
    expect(scored[0].priorityScore).toBeGreaterThan(0);
  });

  it("respects custom weights", () => {
    const gaps = [makeGap("a.ts", 0, 100)];
    const complexityMap = new Map([["a.ts", 0]]);
    const changeFreqMap = new Map([["a.ts", 0]]);

    const scored = scorePriority(gaps, complexityMap, changeFreqMap, {
      coverageGapWeight: 1.0,
      complexityWeight: 0,
      changeFreqWeight: 0,
    });

    expect(scored[0].priorityScore).toBe(100);
  });

  it("clamps score to 0-100", () => {
    const gaps = [makeGap("a.ts", 0, 80)];
    const complexityMap = new Map([["a.ts", 200]]);
    const changeFreqMap = new Map([["a.ts", 200]]);

    const scored = scorePriority(gaps, complexityMap, changeFreqMap);
    expect(scored[0].priorityScore).toBeLessThanOrEqual(100);
    expect(scored[0].priorityScore).toBeGreaterThanOrEqual(0);
  });
});
