import type { PriorityWeights } from "./feedback";

export interface GlobalSettings {
  readonly theme: "light" | "dark";
  readonly locale: "ja" | "en";
  readonly maxCacheSizeBytes: number;
  readonly defaultCoverageThreshold: number;
  readonly defaultColorThresholds: ColorThresholds;
  readonly defaultPriorityWeights: PriorityWeights;
}

export interface ProjectSettings {
  readonly projectId: string;
  readonly projectName: string;
  readonly rootPath: string;
  readonly testRootPath: string | null;
  readonly coverageReportPath: string | null;
  readonly coverageThreshold: number;
  readonly colorThresholds: ColorThresholds;
  readonly excludePatterns: readonly string[];
  readonly pathMappings: readonly PathMapping[];
  readonly priorityWeights: PriorityWeights;
  readonly lastOpenedAt: string;
}

export interface ColorThresholds {
  readonly green: number;
  readonly yellow: number;
}

export interface PathMapping {
  readonly sourcePrefix: string;
  readonly reportPrefix: string;
}

export interface RecentProject {
  readonly projectId: string;
  readonly projectName: string;
  readonly rootPath: string;
  readonly lastOpenedAt: string;
}

export interface WindowState {
  readonly width: number;
  readonly height: number;
  readonly x: number | undefined;
  readonly y: number | undefined;
  readonly isMaximized: boolean;
}
