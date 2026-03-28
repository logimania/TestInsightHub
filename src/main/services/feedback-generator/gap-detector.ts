import type { ModuleCoverage, FileCoverage } from "@shared/types/coverage";
import type { CoverageGap, TestRecommendation } from "@shared/types/feedback";
import type { TestType } from "@shared/types/coverage";
import { classifyTestType } from "../coverage-analyzer/test-classifier";

export function detectGaps(
  moduleCoverages: readonly ModuleCoverage[],
  threshold: number,
): CoverageGap[] {
  const gaps: CoverageGap[] = [];

  for (const mod of moduleCoverages) {
    if (mod.lineCoverage.percentage >= threshold) continue;
    if (mod.colorLevel === "grey") continue;

    for (const file of mod.files) {
      if (file.lineCoverage.percentage >= threshold) continue;

      gaps.push({
        filePath: file.filePath,
        moduleName: mod.moduleId,
        currentCoverage: Math.round(file.lineCoverage.percentage * 10) / 10,
        targetCoverage: threshold,
        uncoveredLines: file.uncoveredLines.map((range) => ({
          start: range.start,
          end: range.end,
          functionName: range.functionName ?? "unknown",
        })),
        recommendedTestType: recommendTestType(file),
        priority: "medium",
        priorityScore: 0,
        complexity: 0,
        changeFrequency: 0,
      });
    }
  }

  return gaps;
}

export function buildRecommendations(
  gaps: readonly CoverageGap[],
): TestRecommendation[] {
  return gaps.map((gap) => {
    const functions = gap.uncoveredLines
      .map((l) => l.functionName)
      .filter((name, i, arr) => name !== "unknown" && arr.indexOf(name) === i);

    const suggestedTestFile = suggestTestFilePath(
      gap.filePath,
      gap.recommendedTestType,
    );

    const description =
      functions.length > 0
        ? `${functions.join(", ")} のテストを追加`
        : `${gap.filePath} のカバレッジを ${gap.targetCoverage}% に引き上げるテストを追加`;

    return {
      type: gap.recommendedTestType,
      targetFile: gap.filePath,
      suggestedTestFile,
      functions,
      description,
    };
  });
}

function recommendTestType(file: FileCoverage): TestType {
  if (file.coveredByTests.length > 0) {
    return file.coveredByTests[0].testType;
  }
  return "unit";
}

function suggestTestFilePath(filePath: string, testType: TestType): string {
  const parts = filePath.split("/");
  const fileName = parts[parts.length - 1] ?? "";
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const ext = fileName.includes(".ts") ? ".test.ts" : ".test.js";

  if (testType === "e2e") {
    return `tests/e2e/${baseName}${ext}`;
  }
  if (testType === "integration") {
    return `tests/integration/${baseName}${ext}`;
  }

  const dir = parts.slice(0, -1).join("/");
  return `${dir}/__tests__/${baseName}${ext}`;
}
