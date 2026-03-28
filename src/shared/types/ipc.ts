import type { ProjectStructure } from "./project";
import type { NormalizedCoverage } from "./coverage";
import type {
  FeedbackFile,
  FeedbackComparison,
  PriorityWeights,
} from "./feedback";
import type {
  GlobalSettings,
  ProjectSettings,
  RecentProject,
} from "./settings";

export const IPC_CHANNELS = {
  PROJECT_SELECT_DIRECTORY: "project:select-directory",
  PROJECT_PARSE: "project:parse",
  PROJECT_PARSE_PROGRESS: "project:parse-progress",
  PROJECT_PARSE_RESULT: "project:parse-result",
  PROJECT_PARSE_ERROR: "project:parse-error",
  COVERAGE_LOAD: "coverage:load",
  COVERAGE_LOAD_RESULT: "coverage:load-result",
  COVERAGE_LOAD_ERROR: "coverage:load-error",
  FEEDBACK_GENERATE: "feedback:generate",
  FEEDBACK_GENERATE_RESULT: "feedback:generate-result",
  FEEDBACK_DEPLOY: "feedback:deploy",
  FEEDBACK_DEPLOY_RESULT: "feedback:deploy-result",
  FEEDBACK_HISTORY: "feedback:history",
  FEEDBACK_COMPARE: "feedback:compare",
  SETTINGS_LOAD_GLOBAL: "settings:load-global",
  SETTINGS_SAVE_GLOBAL: "settings:save-global",
  SETTINGS_LOAD_PROJECT: "settings:load-project",
  SETTINGS_SAVE_PROJECT: "settings:save-project",
  RECENT_PROJECTS_LOAD: "recent-projects:load",
  TEST_RUN: "test:run",
  TEST_RUN_OUTPUT: "test:run-output",
  TEST_RUN_RESULT: "test:run-result",
  TEST_QUALITY_ANALYZE: "test:quality-analyze",
  FILE_WATCH_CHANGE: "file:watch-change",
  EXPORT_DIAGRAM: "export:diagram",
  CACHE_CLEAR: "cache:clear",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export interface ParseProjectRequest {
  readonly rootPath: string;
  readonly testRootPath?: string;
}

export interface ParseProgressEvent {
  readonly current: number;
  readonly total: number;
  readonly currentFile: string;
}

export interface CoverageLoadRequest {
  readonly reportPath?: string;
  readonly autoDetect: boolean;
}

export interface FeedbackGenerateRequest {
  readonly threshold: number;
  readonly weights?: PriorityWeights;
}

export interface FeedbackDeployRequest {
  readonly feedbackFile: FeedbackFile;
  readonly deployPath: string;
}

export interface FeedbackDeployResult {
  readonly success: boolean;
  readonly backupPath?: string;
}

export interface ExportDiagramRequest {
  readonly format: "png" | "svg";
  readonly svgContent: string;
  readonly outputPath?: string;
}

export interface TestRunRequest {
  readonly rootPath: string;
  readonly customCommand?: string;
  readonly timeoutMs?: number;
}

export interface TestQualityRequest {
  readonly rootPath: string;
  readonly testFilePaths: readonly string[];
}

export interface IpcApi {
  project: {
    selectDirectory(): Promise<string | null>;
    parse(request: ParseProjectRequest): Promise<ProjectStructure>;
  };
  coverage: {
    load(request: CoverageLoadRequest): Promise<NormalizedCoverage>;
  };
  test: {
    run(request: TestRunRequest): Promise<NormalizedCoverage | null>;
    analyzeQuality(request: TestQualityRequest): Promise<unknown>;
  };
  feedback: {
    generate(request: FeedbackGenerateRequest): Promise<FeedbackFile>;
    deploy(request: FeedbackDeployRequest): Promise<FeedbackDeployResult>;
    getHistory(projectId: string): Promise<readonly FeedbackFile[]>;
    compare(projectId: string): Promise<FeedbackComparison | null>;
  };
  settings: {
    loadGlobal(): Promise<GlobalSettings>;
    saveGlobal(settings: GlobalSettings): Promise<void>;
    loadProject(projectId: string): Promise<ProjectSettings | null>;
    saveProject(settings: ProjectSettings): Promise<void>;
    loadRecentProjects(): Promise<readonly RecentProject[]>;
  };
  exportDiagram(request: ExportDiagramRequest): Promise<string>;
  clearCache(projectId: string): Promise<void>;
  onParseProgress(callback: (event: ParseProgressEvent) => void): void;
  onTestOutput(
    callback: (line: string, stream: "stdout" | "stderr") => void,
  ): void;
  onFileChange(callback: (filePath: string) => void): void;
  removeAllListeners(channel: IpcChannel): void;
}
