import type {
  FeedbackFile,
  FeedbackComparison,
  GapChange,
  CoverageGap,
} from "@shared/types/feedback";

export function compareFeedback(
  current: FeedbackFile,
  previous: FeedbackFile,
): FeedbackComparison {
  const prevGapMap = new Map<string, CoverageGap>();
  for (const gap of previous.gaps) {
    prevGapMap.set(gap.filePath, gap);
  }

  const improved: GapChange[] = [];
  const unchanged: GapChange[] = [];
  const newGaps: CoverageGap[] = [];

  for (const gap of current.gaps) {
    const prevGap = prevGapMap.get(gap.filePath);
    if (!prevGap) {
      newGaps.push(gap);
      continue;
    }

    const change: GapChange = {
      filePath: gap.filePath,
      previousCoverage: prevGap.currentCoverage,
      currentCoverage: gap.currentCoverage,
      targetCoverage: gap.targetCoverage,
    };

    if (gap.currentCoverage > prevGap.currentCoverage) {
      improved.push(change);
    } else {
      unchanged.push(change);
    }
  }

  // Files that were in previous gaps but not in current (fully resolved)
  for (const [filePath, prevGap] of prevGapMap) {
    if (!current.gaps.some((g) => g.filePath === filePath)) {
      improved.push({
        filePath,
        previousCoverage: prevGap.currentCoverage,
        currentCoverage: prevGap.targetCoverage,
        targetCoverage: prevGap.targetCoverage,
      });
    }
  }

  const totalTracked = improved.length + unchanged.length;
  const improvementRate =
    totalTracked > 0 ? (improved.length / totalTracked) * 100 : 0;

  return {
    previousFeedbackAt: previous.generatedAt,
    currentFeedbackAt: current.generatedAt,
    improved,
    unchanged,
    newGaps,
    improvementRate: Math.round(improvementRate * 10) / 10,
  };
}
