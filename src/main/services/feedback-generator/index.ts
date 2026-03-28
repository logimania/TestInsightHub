import type {
  FeedbackFile,
  PriorityWeights,
  FeedbackSummary,
  ProjectTestEnvironment,
} from "@shared/types/feedback";
import type { ModuleCoverage } from "@shared/types/coverage";
import type { ProjectStructure } from "@shared/types/project";
import { FEEDBACK_FILE_VERSION } from "@shared/constants";
import { detectGaps, buildRecommendations } from "./gap-detector";
import { scorePriority } from "./priority-scorer";
import { detectPrerequisites } from "@shared/utils/prerequisite-detector";

export interface GenerateFeedbackOptions {
  readonly moduleCoverages: readonly ModuleCoverage[];
  readonly projectStructure: ProjectStructure;
  readonly threshold: number;
  readonly weights?: PriorityWeights;
  readonly complexityMap?: ReadonlyMap<string, number>;
  readonly changeFreqMap?: ReadonlyMap<string, number>;
  readonly projectTestEnv?: ProjectTestEnvironment;
}

export function generateFeedback(
  options: GenerateFeedbackOptions,
): FeedbackFile {
  const { moduleCoverages, projectStructure, threshold, weights } = options;

  let gaps = detectGaps(moduleCoverages, threshold);

  const complexityMap =
    options.complexityMap ?? buildComplexityMap(projectStructure);
  const changeFreqMap = options.changeFreqMap ?? new Map<string, number>();

  gaps = scorePriority(gaps, complexityMap, changeFreqMap, weights);
  gaps.sort((a, b) => b.priorityScore - a.priorityScore);

  // prerequisites 付与（環境情報がある場合のみ）
  const env = options.projectTestEnv;
  if (env) {
    gaps = gaps.map((g) => ({
      ...g,
      prerequisites: detectPrerequisites(
        g.filePath,
        g.recommendedTestType,
        env,
      ),
    }));
  }

  const recommendations = buildRecommendations(gaps);

  const totalCovered = moduleCoverages.reduce(
    (sum, m) => sum + m.lineCoverage.covered,
    0,
  );
  const totalLines = moduleCoverages.reduce(
    (sum, m) => sum + m.lineCoverage.total,
    0,
  );

  const summary: FeedbackSummary = {
    totalModules: moduleCoverages.length,
    belowThreshold: moduleCoverages.filter(
      (m) => m.lineCoverage.percentage < threshold && m.colorLevel !== "grey",
    ).length,
    totalUncoveredFunctions: gaps.reduce(
      (sum, g) => sum + g.uncoveredLines.length,
      0,
    ),
    overallCoverage:
      totalLines > 0 ? Math.round((totalCovered / totalLines) * 1000) / 10 : 0,
  };

  return {
    version: FEEDBACK_FILE_VERSION,
    generatedAt: new Date().toISOString(),
    projectRoot: projectStructure.rootPath,
    coverageThreshold: threshold,
    summary,
    gaps,
    recommendations,
  };
}

function buildComplexityMap(structure: ProjectStructure): Map<string, number> {
  const map = new Map<string, number>();
  for (const mod of structure.modules) {
    for (const file of mod.files) {
      const maxComplexity =
        file.functions.length > 0
          ? Math.max(...file.functions.map((f) => f.complexity))
          : 1;
      map.set(file.path, maxComplexity);
    }
  }
  return map;
}
