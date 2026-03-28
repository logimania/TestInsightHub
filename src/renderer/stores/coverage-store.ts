import { create } from "zustand";
import type {
  NormalizedCoverage,
  ModuleCoverage,
  CoverageMode,
  CoverageMetric,
  CoverageColorLevel,
  TestType,
  FileCoverage,
} from "@shared/types/coverage";
import type { ModuleNode } from "@shared/types/project";

interface CoverageState {
  readonly normalizedCoverage: NormalizedCoverage | null;
  readonly moduleCoverages: readonly ModuleCoverage[];
  readonly coverageMode: CoverageMode;
  readonly testTypeFilter: TestType | "all";
  readonly isLoading: boolean;
  readonly loadCoverage: (reportPath?: string) => Promise<void>;
  readonly setCoverageMode: (mode: CoverageMode) => void;
  readonly setTestTypeFilter: (filter: TestType | "all") => void;
  readonly computeModuleCoverages: (modules: readonly ModuleNode[]) => void;
  readonly reset: () => void;
}

export const useCoverageStore = create<CoverageState>((set, get) => ({
  normalizedCoverage: null,
  moduleCoverages: [],
  coverageMode: "line",
  testTypeFilter: "all",
  isLoading: false,

  loadCoverage: async (reportPath) => {
    set({ isLoading: true });
    try {
      const normalizedCoverage = await window.api.coverage.load({
        reportPath,
        autoDetect: !reportPath,
      });
      set({ normalizedCoverage, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setCoverageMode: (mode) => {
    const { moduleCoverages } = get();
    // Re-determine color levels based on the new mode
    const updated = moduleCoverages.map((mc) => {
      const metric = getMetricForMode(mc, mode);
      return { ...mc, colorLevel: determineColor(metric.percentage) };
    });
    set({ coverageMode: mode, moduleCoverages: updated });
  },

  setTestTypeFilter: (filter) => {
    set({ testTypeFilter: filter });
  },

  computeModuleCoverages: (modules) => {
    const { normalizedCoverage, coverageMode } = get();
    if (!normalizedCoverage) {
      set({ moduleCoverages: [] });
      return;
    }

    const moduleCoverages = aggregateByModule(
      normalizedCoverage.files,
      modules,
      coverageMode,
    );
    set({ moduleCoverages });
  },

  reset: () => {
    set({
      normalizedCoverage: null,
      moduleCoverages: [],
      coverageMode: "line",
      testTypeFilter: "all",
      isLoading: false,
    });
  },
}));

function getMetricForMode(
  mc: ModuleCoverage,
  mode: CoverageMode,
): CoverageMetric {
  switch (mode) {
    case "branch":
      return mc.branchCoverage ?? mc.lineCoverage;
    case "function":
      return mc.functionCoverage;
    case "line":
    default:
      return mc.lineCoverage;
  }
}

// Inline aggregation (avoids importing Main process code into Renderer)
function aggregateByModule(
  files: readonly FileCoverage[],
  modules: readonly ModuleNode[],
  coverageMode: CoverageMode = "line",
): ModuleCoverage[] {
  const results: ModuleCoverage[] = [];

  for (const mod of modules) {
    const moduleFilePaths = new Set(mod.files.map((f) => f.path));
    const moduleFiles = files.filter((f) => moduleFilePaths.has(f.filePath));

    if (moduleFiles.length === 0) {
      results.push({
        moduleId: mod.id,
        lineCoverage: { covered: 0, total: 0, percentage: 0 },
        branchCoverage: null,
        functionCoverage: { covered: 0, total: 0, percentage: 0 },
        files: [],
        colorLevel: "grey",
      });
      continue;
    }

    const lineCoverage = sumMetrics(moduleFiles.map((f) => f.lineCoverage));
    const functionCoverage = sumMetrics(
      moduleFiles.map((f) => f.functionCoverage),
    );

    const branchMetrics = moduleFiles
      .map((f) => f.branchCoverage)
      .filter((b): b is CoverageMetric => b !== null);
    const branchCoverage =
      branchMetrics.length > 0 ? sumMetrics(branchMetrics) : null;

    const activeMetric =
      coverageMode === "branch"
        ? (branchCoverage ?? lineCoverage)
        : coverageMode === "function"
          ? functionCoverage
          : lineCoverage;

    const colorLevel = determineColor(activeMetric.percentage);

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

function sumMetrics(metrics: readonly CoverageMetric[]): CoverageMetric {
  let covered = 0;
  let total = 0;
  for (const m of metrics) {
    covered += m.covered;
    total += m.total;
  }
  return {
    covered,
    total,
    percentage: total > 0 ? (covered / total) * 100 : 0,
  };
}

function determineColor(percentage: number): CoverageColorLevel {
  if (percentage >= 80) return "green";
  if (percentage >= 50) return "yellow";
  if (percentage > 0) return "red";
  return "grey";
}
