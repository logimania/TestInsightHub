import { create } from "zustand";
import type {
  FeedbackFile,
  FeedbackComparison,
  FeedbackSummary,
  PriorityWeights,
  CoverageGap,
  TestRecommendation,
} from "@shared/types/feedback";
import type {
  EnrichedGap,
  UncoveredBranch,
  TestScenario,
} from "@shared/types/feedback-display";
import type {
  ModuleCoverage,
  FileCoverage,
  TestType,
} from "@shared/types/coverage";
import type { ProjectStructure, ParsedFile } from "@shared/types/project";
import {
  FEEDBACK_FILE_VERSION,
  DEFAULT_PRIORITY_WEIGHTS,
  PRIORITY_SCORE_THRESHOLDS,
} from "@shared/constants";
import { evaluateQualityGate } from "@shared/utils/quality-gate";

interface FeedbackState {
  readonly currentFeedback: FeedbackFile | null;
  readonly enrichedGaps: readonly EnrichedGap[];
  readonly comparison: FeedbackComparison | null;
  readonly history: readonly FeedbackFile[];
  readonly isGenerating: boolean;
  readonly generateFromData: (
    structure: ProjectStructure,
    moduleCoverages: readonly ModuleCoverage[],
    threshold: number,
    weights?: PriorityWeights,
  ) => void;
  readonly deploy: (deployPath: string) => Promise<void>;
  readonly reset: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  currentFeedback: null,
  enrichedGaps: [],
  comparison: null,
  history: [],
  isGenerating: false,

  generateFromData: (structure, moduleCoverages, threshold, weights) => {
    set({ isGenerating: true });

    // カバレッジ対象はsrc配下のみ
    const srcCoverages = moduleCoverages.filter((mc) =>
      isSrcModule(mc.moduleId),
    );

    try {
      const feedback = generateFeedbackLocal(
        structure,
        srcCoverages,
        threshold,
        weights,
      );
      const enrichedGaps = buildEnrichedGaps(
        structure,
        srcCoverages,
        threshold,
        weights,
      );
      const { currentFeedback: previous } = get();
      const comparison = previous
        ? compareFeedbackLocal(feedback, previous)
        : null;
      set({
        currentFeedback: feedback,
        enrichedGaps,
        history: [...get().history, feedback],
        comparison,
        isGenerating: false,
      });
    } catch (err) {
      console.error("[FB] generation error:", err);
      set({ isGenerating: false });
    }
  },

  deploy: async (deployPath) => {
    const { currentFeedback } = get();
    if (!currentFeedback) return;
    await window.api.feedback.deploy({
      feedbackFile: currentFeedback,
      deployPath,
    });
  },

  reset: () => {
    set({
      currentFeedback: null,
      enrichedGaps: [],
      comparison: null,
      history: [],
      isGenerating: false,
    });
  },
}));

// === Enriched Gap 生成 ===

function buildEnrichedGaps(
  structure: ProjectStructure,
  moduleCoverages: readonly ModuleCoverage[],
  threshold: number,
  weights: PriorityWeights = DEFAULT_PRIORITY_WEIGHTS,
): EnrichedGap[] {
  const allFiles = structure.modules.flatMap((m) => m.files);
  const enriched: EnrichedGap[] = [];

  for (const mod of moduleCoverages) {
    // greyモジュール（カバレッジデータなし）の場合、ソースファイルから0%エントリを作る
    let filesToCheck = mod.files;
    if (mod.colorLevel === "grey" && mod.files.length === 0) {
      const sourceModule = structure.modules.find((m) => m.id === mod.moduleId);
      if (sourceModule) {
        filesToCheck = sourceModule.files.map((f) => ({
          filePath: f.path,
          lineCoverage: { covered: 0, total: f.loc, percentage: 0 },
          branchCoverage: null,
          functionCoverage: {
            covered: 0,
            total: f.functions.length || 1,
            percentage: 0,
          },
          uncoveredLines: [{ start: 1, end: f.loc }],
          uncoveredFunctions: f.functions.map((fn) => fn.name),
          coveredByTests: [],
        }));
      }
    }
    for (const file of filesToCheck) {
      if (file.lineCoverage.percentage >= threshold) continue;
      const src = allFiles.find((f) => f.path === file.filePath);


      // ソースファイルの実際の関数名を取得（制御構文を除外）
      const sourceFunctionNames = src
        ? src.functions.map((fn) => fn.name).filter(isRealFunctionName)
        : [];

      // uncoveredFunctionsを補完・フィルタ
      let uncoveredFunctions =
        file.uncoveredFunctions.filter(isRealFunctionName);
      if (uncoveredFunctions.length === 0 && sourceFunctionNames.length > 0) {
        // カバレッジレポートに関数名がない場合、ソースから全関数を未テストとして扱う
        uncoveredFunctions = sourceFunctionNames;
      }

      const testType = inferTestType(file.filePath);
      const branches = src ? extractBranches(src, file) : [];
      const quality = analyzeQuality(file);
      const complexity = src
        ? Math.max(...src.functions.map((f) => f.complexity), 1)
        : 1;
      const cgVal =
        threshold > 0
          ? ((threshold - file.lineCoverage.percentage) / threshold) * 100
          : 0;
      const ps = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            weights.coverageGapWeight * cgVal +
              weights.complexityWeight * Math.min(complexity, 100),
          ),
        ),
      );
      const priority =
        ps >= PRIORITY_SCORE_THRESHOLDS.high
          ? "high"
          : ps >= PRIORITY_SCORE_THRESHOLDS.medium
            ? "medium"
            : "low";
      // シナリオ生成には補完済みの関数名を使う
      const fileForScenarios = { ...file, uncoveredFunctions };
      const scenarios = generateScenarios(fileForScenarios, src, branches);

      enriched.push({
        filePath: file.filePath,
        moduleName: mod.moduleId,
        lineCoverage: file.lineCoverage,
        branchCoverage: file.branchCoverage,
        functionCoverage: file.functionCoverage,
        targetCoverage: threshold,
        priority,
        priorityScore: ps,
        complexity,
        recommendedTestType: testType,
        uncoveredFunctions,
        uncoveredBranches: branches,
        qualityLevel: quality.level,
        qualityScore: quality.score,
        qualitySuggestions: quality.suggestions,
        requiredScenarios: scenarios,
      });
    }
  }
  return enriched.sort((a, b) => b.priorityScore - a.priorityScore);
}

const NOT_FUNCTION_NAMES = new Set([
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "return",
  "try",
  "catch",
  "finally",
  "throw",
  "new",
  "delete",
  "typeof",
  "instanceof",
  "void",
  "in",
  "of",
  "const",
  "let",
  "var",
  "function",
  "class",
  "import",
  "export",
  "default",
  "from",
  "async",
  "await",
  "yield",
  "unknown",
  "(empty-report)",
]);

function isRealFunctionName(name: string): boolean {
  if (!name || name.length === 0) return false;
  if (NOT_FUNCTION_NAMES.has(name)) return false;
  // 1文字や記号だけの名前を除外
  if (name.length === 1) return false;
  if (/^[^a-zA-Z_$]/.test(name)) return false;
  return true;
}

function inferTestType(path: string): TestType {
  const l = path.toLowerCase();

  // IPC handlers, API routes → integration test
  if (/\/(api|controller|handler|route)\//.test(l)) return "integration";
  if (/\/ipc\//.test(l)) return "integration";

  // React components, pages, stores, hooks → e2e test
  if (/\/renderer\/(pages|components|stores|hooks)\//.test(l)) return "e2e";
  if (/\/(pages|page|e2e|flow)\//.test(l)) return "e2e";
  if (/\.(tsx|jsx)$/.test(l) && /\/renderer\//.test(l)) return "e2e";

  // Preload, main entry → integration test
  if (/\/preload\//.test(l)) return "integration";
  if (/\/main\/index\.ts$/.test(l)) return "integration";

  return "unit";
}

function extractBranches(
  src: ParsedFile,
  cov: FileCoverage,
): UncoveredBranch[] {
  if (!cov.branchCoverage || cov.branchCoverage.total === 0) return [];
  return cov.uncoveredLines.slice(0, 10).map((r) => {
    // functionNameが無い/ダミーの場合、ソースの関数リストから該当行の関数を探す
    let fnName = r.functionName;
    if (!fnName || fnName === "(empty-report)" || fnName === "unknown") {
      const matched = src.functions.find(
        (f) => r.start >= f.startLine && r.start <= f.endLine,
      );
      fnName = matched?.name;
    }
    return {
      line: r.start,
      condition: fnName
        ? `${fnName} 内の分岐 (L${r.start}-${r.end})`
        : `L${r.start}-${r.end} の分岐`,
      uncoveredPath: "both" as const,
    };
  });
}

function analyzeQuality(file: FileCoverage): {
  level: "high" | "medium" | "low" | "none";
  score: number;
  suggestions: string[];
} {
  if (file.coveredByTests.length === 0) {
    return {
      level: "none",
      score: 0,
      suggestions: ["テストが存在しません。テストを新規作成してください。"],
    };
  }
  const suggestions: string[] = [];
  let score = 2; // has tests
  if (file.lineCoverage.percentage >= 80) score += 3;
  else if (file.lineCoverage.percentage >= 50) score += 1;
  else
    suggestions.push(
      "行カバレッジが不十分です。テストケースを追加してください。",
    );
  if (file.branchCoverage) {
    if (file.branchCoverage.percentage >= 70) score += 3;
    else
      suggestions.push(
        "分岐カバレッジが低いです。if/else の両方のパスをテストしてください。",
      );
  } else {
    suggestions.push("分岐カバレッジが未計測です。");
  }
  if (file.functionCoverage.percentage >= 80) score += 2;
  else if (file.uncoveredFunctions.length > 0)
    suggestions.push(`未テスト関数: ${file.uncoveredFunctions.join(", ")}`);
  const pct = (score / 10) * 100;
  return {
    level: pct >= 70 ? "high" : pct >= 40 ? "medium" : "low",
    score: Math.round(pct),
    suggestions,
  };
}

function generateScenarios(
  file: FileCoverage,
  src: ParsedFile | undefined,
  branches: UncoveredBranch[],
): TestScenario[] {
  const scenarios: TestScenario[] = [];
  for (const fn of file.uncoveredFunctions) {
    scenarios.push({
      type: "normal",
      description: `${fn} の正常系テスト`,
      assertions: [
        "戻り値が期待した型である",
        "戻り値の内容が正しい",
        "副作用が正しく行われる",
      ],
    });
  }
  if (file.uncoveredFunctions.length > 0) {
    scenarios.push({
      type: "error",
      description: "エラーケースのテスト",
      assertions: [
        "不正な入力で適切なエラーが投げられる",
        "エラーメッセージが適切",
        "エラー時に状態が変更されない",
      ],
    });
  }
  if (branches.length > 0) {
    scenarios.push({
      type: "boundary",
      description: "分岐カバレッジテスト",
      assertions: branches.map(
        (b) => `L${b.line}: ${b.condition} の両パスをテスト`,
      ),
    });
  } else if (file.uncoveredFunctions.length > 0) {
    scenarios.push({
      type: "boundary",
      description: "境界値テスト",
      assertions: [
        "空入力 / null / undefined のハンドリング",
        "最大値・最小値の入力",
        "空配列 / 空オブジェクトの処理",
      ],
    });
  }
  return scenarios;
}

// === 基本FB生成（JSON出力用） ===

function generateFeedbackLocal(
  s: ProjectStructure,
  mc: readonly ModuleCoverage[],
  th: number,
  w: PriorityWeights = DEFAULT_PRIORITY_WEIGHTS,
): FeedbackFile {
  let gaps = detectGaps(mc, th);
  const cMap = new Map<string, number>();
  for (const mod of s.modules)
    for (const f of mod.files)
      cMap.set(
        f.path,
        f.functions.length > 0
          ? Math.max(...f.functions.map((fn) => fn.complexity))
          : 1,
      );
  gaps = scorePriority(gaps, cMap, w);
  gaps.sort((a, b) => b.priorityScore - a.priorityScore);

  const recs = buildRecommendations(gaps);
  const tc = mc.reduce((s, m) => s + m.lineCoverage.covered, 0);
  const tl = mc.reduce((s, m) => s + m.lineCoverage.total, 0);
  const qualityGate = evaluateQualityGate(mc, th);
  return {
    version: FEEDBACK_FILE_VERSION,
    generatedAt: new Date().toISOString(),
    projectRoot: s.rootPath,
    coverageThreshold: th,
    qualityGate,
    summary: {
      totalModules: mc.length,
      belowThreshold: mc.filter(
        (m) => m.lineCoverage.percentage < th && m.colorLevel !== "grey",
      ).length,
      totalUncoveredFunctions: gaps.reduce(
        (s, g) => s + g.uncoveredLines.length,
        0,
      ),
      overallCoverage: tl > 0 ? Math.round((tc / tl) * 1000) / 10 : 0,
    },
    gaps,
    recommendations: recs,
  };
}

function detectGaps(mc: readonly ModuleCoverage[], th: number): CoverageGap[] {
  const gaps: CoverageGap[] = [];
  for (const mod of mc) {
    if (mod.lineCoverage.percentage >= th) continue;
    for (const f of mod.files) {
      if (f.lineCoverage.percentage >= th) continue;
      gaps.push({
        filePath: f.filePath,
        moduleName: mod.moduleId,
        currentCoverage: Math.round(f.lineCoverage.percentage * 10) / 10,
        targetCoverage: th,
        uncoveredLines: f.uncoveredLines.map((r) => ({
          start: r.start,
          end: r.end,
          functionName: r.functionName ?? "unknown",
        })),
        recommendedTestType: inferTestType(f.filePath),
        priority: "medium",
        priorityScore: 0,
        complexity: 0,
        changeFrequency: 0,
      });
    }
  }
  return gaps;
}

function scorePriority(
  gaps: CoverageGap[],
  cMap: Map<string, number>,
  w: PriorityWeights,
): CoverageGap[] {
  return gaps.map((g) => {
    const cg =
      g.targetCoverage > 0
        ? ((g.targetCoverage - g.currentCoverage) / g.targetCoverage) * 100
        : 0;
    const c = Math.min(cMap.get(g.filePath) ?? 1, 100);
    const ps = Math.max(
      0,
      Math.min(
        100,
        Math.round(w.coverageGapWeight * cg + w.complexityWeight * c),
      ),
    );
    return {
      ...g,
      priorityScore: ps,
      complexity: c,
      priority: (ps >= PRIORITY_SCORE_THRESHOLDS.high
        ? "high"
        : ps >= PRIORITY_SCORE_THRESHOLDS.medium
          ? "medium"
          : "low") as "high" | "medium" | "low",
    };
  });
}

function buildRecommendations(gaps: CoverageGap[]): TestRecommendation[] {
  return gaps.map((g) => {
    const fns = g.uncoveredLines
      .map((l) => l.functionName)
      .filter((n, i, a) => n !== "unknown" && a.indexOf(n) === i);
    const p = g.filePath.split("/");
    const b = (p[p.length - 1] ?? "").replace(/\.[^.]+$/, "");
    const e = g.filePath.includes(".ts") ? ".test.ts" : ".test.js";
    return {
      type: inferTestType(g.filePath),
      targetFile: g.filePath,
      suggestedTestFile: `${p.slice(0, -1).join("/")}/__tests__/${b}${e}`,
      functions: fns,
      description:
        fns.length > 0
          ? `${fns.join(", ")} のテストを追加`
          : `${g.filePath} のカバレッジ向上`,
    };
  });
}

function compareFeedbackLocal(
  cur: FeedbackFile,
  prev: FeedbackFile,
): FeedbackComparison {
  const pm = new Map(prev.gaps.map((g) => [g.filePath, g]));
  const imp: FeedbackComparison["improved"] = [];
  const unc: FeedbackComparison["unchanged"] = [];
  const ng: CoverageGap[] = [];
  for (const g of cur.gaps) {
    const p = pm.get(g.filePath);
    if (!p) ng.push(g);
    else if (g.currentCoverage > p.currentCoverage)
      imp.push({
        filePath: g.filePath,
        previousCoverage: p.currentCoverage,
        currentCoverage: g.currentCoverage,
        targetCoverage: g.targetCoverage,
      });
    else
      unc.push({
        filePath: g.filePath,
        previousCoverage: p.currentCoverage,
        currentCoverage: g.currentCoverage,
        targetCoverage: g.targetCoverage,
      });
  }
  const t = imp.length + unc.length;
  return {
    previousFeedbackAt: prev.generatedAt,
    currentFeedbackAt: cur.generatedAt,
    improved: imp,
    unchanged: unc,
    newGaps: ng,
    improvementRate: t > 0 ? Math.round((imp.length / t) * 1000) / 10 : 0,
  };
}

function isSrcModule(moduleId: string): boolean {
  return (
    moduleId === "src" ||
    moduleId.startsWith("src/") ||
    moduleId.startsWith("src\\")
  );
}
