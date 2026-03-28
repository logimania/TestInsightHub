import { describe, it, expect } from "vitest";
import { compareFeedback } from "../../../src/main/services/feedback-generator/cycle-tracker";
import type { FeedbackFile, CoverageGap } from "@shared/types/feedback";

function makeFeedback(
  gaps: CoverageGap[],
  generatedAt: string = "2026-03-22T10:00:00Z",
): FeedbackFile {
  return {
    version: "1.0.0",
    generatedAt,
    projectRoot: "/project",
    coverageThreshold: 80,
    summary: {
      totalModules: 5,
      belowThreshold: gaps.length,
      totalUncoveredFunctions: 0,
      overallCoverage: 60,
    },
    gaps,
    recommendations: [],
  };
}

function makeGap(filePath: string, coverage: number): CoverageGap {
  return {
    filePath,
    moduleName: "mod",
    currentCoverage: coverage,
    targetCoverage: 80,
    uncoveredLines: [],
    recommendedTestType: "unit",
    priority: "medium",
    priorityScore: 50,
    complexity: 5,
    changeFrequency: 3,
  };
}

describe("compareFeedback", () => {
  it("identifies improved files", () => {
    const previous = makeFeedback(
      [makeGap("a.ts", 40)],
      "2026-03-20T10:00:00Z",
    );
    const current = makeFeedback([makeGap("a.ts", 60)], "2026-03-22T10:00:00Z");

    const result = compareFeedback(current, previous);

    expect(result.improved.length).toBe(1);
    expect(result.improved[0].previousCoverage).toBe(40);
    expect(result.improved[0].currentCoverage).toBe(60);
    expect(result.unchanged.length).toBe(0);
  });

  it("identifies unchanged files", () => {
    const previous = makeFeedback([makeGap("a.ts", 40)]);
    const current = makeFeedback([makeGap("a.ts", 40)]);

    const result = compareFeedback(current, previous);

    expect(result.unchanged.length).toBe(1);
    expect(result.improved.length).toBe(0);
  });

  it("identifies new gaps", () => {
    const previous = makeFeedback([makeGap("a.ts", 40)]);
    const current = makeFeedback([makeGap("a.ts", 50), makeGap("b.ts", 30)]);

    const result = compareFeedback(current, previous);

    expect(result.newGaps.length).toBe(1);
    expect(result.newGaps[0].filePath).toBe("b.ts");
  });

  it("counts fully resolved files as improved", () => {
    const previous = makeFeedback([makeGap("a.ts", 40), makeGap("b.ts", 30)]);
    const current = makeFeedback([makeGap("b.ts", 50)]);

    const result = compareFeedback(current, previous);

    expect(result.improved.length).toBe(2);
    const resolved = result.improved.find((i) => i.filePath === "a.ts");
    expect(resolved).toBeDefined();
    expect(resolved!.currentCoverage).toBe(80);
  });

  it("calculates improvement rate", () => {
    const previous = makeFeedback([makeGap("a.ts", 40), makeGap("b.ts", 30)]);
    const current = makeFeedback([makeGap("a.ts", 60), makeGap("b.ts", 30)]);

    const result = compareFeedback(current, previous);

    expect(result.improvementRate).toBe(50);
  });

  it("returns 0% improvement when nothing changed", () => {
    const previous = makeFeedback([makeGap("a.ts", 40)]);
    const current = makeFeedback([makeGap("a.ts", 40)]);

    const result = compareFeedback(current, previous);

    expect(result.improvementRate).toBe(0);
  });
});
