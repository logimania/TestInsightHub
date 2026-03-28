import type {
  FileCoverage,
  ModuleCoverage,
  CoverageMetric,
  CoverageColorLevel,
} from "@shared/types/coverage";
import type { ModuleNode } from "@shared/types/project";
import type { ColorThresholds } from "@shared/types/settings";
import { DEFAULT_COLOR_THRESHOLDS } from "@shared/constants";

export function aggregateByModule(
  files: readonly FileCoverage[],
  modules: readonly ModuleNode[],
  thresholds: ColorThresholds = DEFAULT_COLOR_THRESHOLDS,
): readonly ModuleCoverage[] {
  const filesByModule = groupFilesByModule(files, modules);
  const results: ModuleCoverage[] = [];

  for (const mod of modules) {
    const moduleFiles = filesByModule.get(mod.id) ?? [];
    if (moduleFiles.length === 0) {
      results.push(createEmptyModuleCoverage(mod.id));
      continue;
    }

    const lineCoverage = aggregateMetric(moduleFiles, (f) => f.lineCoverage);
    const branchCoverage = aggregateBranchMetric(moduleFiles);
    const functionCoverage = aggregateMetric(
      moduleFiles,
      (f) => f.functionCoverage,
    );
    const colorLevel = determineColorLevel(lineCoverage.percentage, thresholds);

    results.push({
      moduleId: mod.id,
      lineCoverage,
      branchCoverage,
      functionCoverage,
      files: moduleFiles,
      colorLevel,
    });
  }

  return results;
}

function groupFilesByModule(
  files: readonly FileCoverage[],
  modules: readonly ModuleNode[],
): Map<string, FileCoverage[]> {
  const map = new Map<string, FileCoverage[]>();

  for (const file of files) {
    const mod = findModule(file.filePath, modules);
    if (!mod) continue;

    if (!map.has(mod.id)) {
      map.set(mod.id, []);
    }
    map.get(mod.id)!.push(file);
  }

  return map;
}

function findModule(
  filePath: string,
  modules: readonly ModuleNode[],
): ModuleNode | undefined {
  return modules.find((mod) => mod.files.some((f) => f.path === filePath));
}

function aggregateMetric(
  files: readonly FileCoverage[],
  getMetric: (f: FileCoverage) => CoverageMetric,
): CoverageMetric {
  let covered = 0;
  let total = 0;

  for (const file of files) {
    const m = getMetric(file);
    covered += m.covered;
    total += m.total;
  }

  return {
    covered,
    total,
    percentage: total > 0 ? (covered / total) * 100 : 0,
  };
}

function aggregateBranchMetric(
  files: readonly FileCoverage[],
): CoverageMetric | null {
  let covered = 0;
  let total = 0;
  let hasBranch = false;

  for (const file of files) {
    if (file.branchCoverage) {
      hasBranch = true;
      covered += file.branchCoverage.covered;
      total += file.branchCoverage.total;
    }
  }

  if (!hasBranch) return null;
  return {
    covered,
    total,
    percentage: total > 0 ? (covered / total) * 100 : 0,
  };
}

export function determineColorLevel(
  percentage: number,
  thresholds: ColorThresholds = DEFAULT_COLOR_THRESHOLDS,
): CoverageColorLevel {
  if (percentage >= thresholds.green) return "green";
  if (percentage >= thresholds.yellow) return "yellow";
  if (percentage > 0) return "red";
  return "grey";
}

function createEmptyModuleCoverage(moduleId: string): ModuleCoverage {
  const zeroMetric: CoverageMetric = { covered: 0, total: 0, percentage: 0 };
  return {
    moduleId,
    lineCoverage: zeroMetric,
    branchCoverage: null,
    functionCoverage: zeroMetric,
    files: [],
    colorLevel: "grey",
  };
}
