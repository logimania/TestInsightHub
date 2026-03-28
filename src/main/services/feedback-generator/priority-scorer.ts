import type { CoverageGap, PriorityWeights } from "@shared/types/feedback";
import {
  DEFAULT_PRIORITY_WEIGHTS,
  PRIORITY_SCORE_THRESHOLDS,
} from "@shared/constants";

export function scorePriority(
  gaps: CoverageGap[],
  complexityMap: ReadonlyMap<string, number>,
  changeFreqMap: ReadonlyMap<string, number>,
  weights: PriorityWeights = DEFAULT_PRIORITY_WEIGHTS,
): CoverageGap[] {
  return gaps.map((gap) => {
    const coverageGap = normalizeCoverageGap(
      gap.currentCoverage,
      gap.targetCoverage,
    );
    const complexity = complexityMap.get(gap.filePath) ?? 1;
    const changeFrequency = changeFreqMap.get(gap.filePath) ?? 0;

    const normalizedComplexity = Math.min(complexity, 100);
    const normalizedChangeFreq = Math.min(changeFrequency, 100);

    const priorityScore = Math.round(
      weights.coverageGapWeight * coverageGap +
        weights.complexityWeight * normalizedComplexity +
        weights.changeFreqWeight * normalizedChangeFreq,
    );

    const clampedScore = Math.max(0, Math.min(100, priorityScore));
    const priority = determinePriorityLabel(clampedScore);

    return {
      ...gap,
      priorityScore: clampedScore,
      complexity: normalizedComplexity,
      changeFrequency: normalizedChangeFreq,
      priority,
    };
  });
}

function normalizeCoverageGap(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.round(((target - current) / target) * 100);
}

function determinePriorityLabel(score: number): "high" | "medium" | "low" {
  if (score >= PRIORITY_SCORE_THRESHOLDS.high) return "high";
  if (score >= PRIORITY_SCORE_THRESHOLDS.medium) return "medium";
  return "low";
}
