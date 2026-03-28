import type { ModuleCoverage } from "../types/coverage";
import type { QualityGate, ModuleGateResult } from "../types/feedback";

/**
 * ソースコード（src/配下）のモジュールのみを対象にゲート判定を行う。
 * tests/, coverage/, eval/, node_modules/ 等はテスト対象外のため除外。
 * 1つでも閾値未満のソースモジュールがあれば不合格。
 * 純粋関数。
 */
export function evaluateQualityGate(
  moduleCoverages: readonly ModuleCoverage[],
  threshold: number,
): QualityGate {
  const sourceModules = moduleCoverages.filter((mc) =>
    isSrcModule(mc.moduleId),
  );

  const moduleResults: ModuleGateResult[] = sourceModules.map((mc) => {
    const coverage = mc.lineCoverage.percentage;
    const isGrey = mc.colorLevel === "grey";
    const untestedFileCount = mc.files.filter(
      (f) => f.lineCoverage.percentage === 0,
    ).length;

    // grey モジュール（カバレッジデータなし）は不合格
    const passed = isGrey ? false : coverage >= threshold;

    return {
      moduleId: mc.moduleId,
      coverage: Math.round(coverage * 10) / 10,
      threshold,
      passed,
      fileCount: isGrey ? 0 : mc.files.length,
      untestedFileCount: isGrey ? 0 : untestedFileCount,
    };
  });

  const failedModules = moduleResults
    .filter((r) => !r.passed)
    .map((r) => r.moduleId);

  const passed = failedModules.length === 0;

  const verdict = passed
    ? `合格: 全${moduleResults.length}モジュールが閾値${threshold}%を達成`
    : `不合格: ${failedModules.length}/${moduleResults.length}モジュールが閾値${threshold}%未満。` +
      `未達モジュール: ${failedModules.join(", ")}。` +
      `全モジュールが閾値を超えるまでテストを追加してください。`;

  return {
    passed,
    verdict,
    moduleResults,
    failedModules,
  };
}

function isSrcModule(moduleId: string): boolean {
  return (
    moduleId === "src" ||
    moduleId.startsWith("src/") ||
    moduleId.startsWith("src\\")
  );
}
