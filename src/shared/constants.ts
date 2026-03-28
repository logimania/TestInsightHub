import type { ColorThresholds } from "./types/settings";
import type { PriorityWeights } from "./types/feedback";

export const APP_NAME = "Test Insight Hub";
export const APP_VERSION = "0.1.0";
export const FEEDBACK_FILE_VERSION = "1.1.0";

export const DEFAULT_COVERAGE_THRESHOLD = 80;

export const DEFAULT_COLOR_THRESHOLDS: ColorThresholds = {
  green: 80,
  yellow: 50,
};

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  coverageGapWeight: 0.4,
  complexityWeight: 0.3,
  changeFreqWeight: 0.3,
};

export const PRIORITY_SCORE_THRESHOLDS = {
  high: 70,
  medium: 40,
} as const;

export const CACHE_MAX_SIZE_PER_PROJECT_BYTES = 500 * 1024 * 1024; // 500MB
export const CACHE_MAX_TOTAL_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
export const RECENT_PROJECTS_MAX = 20;
export const FEEDBACK_HISTORY_MAX = 50;

export const CHANGE_FREQUENCY_DAYS = 90;
export const CHANGE_FREQUENCY_RECENT_DAYS = 30;
export const CHANGE_FREQUENCY_RECENT_SCORE = 50;

export const LARGE_PROJECT_WARNING_THRESHOLD = 50_000;
export const PARSE_PROGRESS_INTERVAL = 100;

export const MODULE_COLLAPSE_THRESHOLD = 500;

export const EXCLUDED_DIRS = [
  "node_modules",
  "dist",
  "build",
  ".git",
  ".next",
  "__pycache__",
  "target",
  "vendor",
  ".venv",
  "venv",
];

export const TEST_FILE_PATTERNS = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /test_.*\.py$/,
  /.*_test\.py$/,
  /.*_test\.go$/,
  /.*_test\.rs$/,
];

export const TEST_DIR_NAMES = ["tests", "test", "__tests__", "spec", "specs"];

export const COVERAGE_AUTO_DETECT_PATHS = [
  "coverage/coverage-final.json",
  "coverage/lcov.info",
  ".coverage/coverage.json",
  "htmlcov/coverage.json",
  "lcov.info",
  "coverage.json",
  "coverage-final.json",
];

export const FEEDBACK_DEFAULT_DEPLOY_DIR = ".test-insight";
export const FEEDBACK_DEFAULT_FILENAME = "feedback.json";

// --- Prerequisite Rules ---

import type { TestType } from "./types/coverage";

export interface PrerequisiteRule {
  readonly testType: TestType | "any";
  readonly filePattern: RegExp;
  readonly requiredPackages: readonly {
    readonly name: string;
    readonly alternatives?: readonly string[];
    readonly installCommand: string;
    readonly description: string;
  }[];
  readonly requiredConfigs: readonly {
    readonly name: string;
    readonly detectPattern: string;
    readonly description: string;
    readonly configExample: string;
  }[];
}

export const PREREQUISITE_RULES: readonly PrerequisiteRule[] = [
  // React component tests need @testing-library/react + jsdom
  // testType "any" so this fires for both unit and e2e typed .tsx files
  {
    testType: "any",
    filePattern: /\.(tsx|jsx)$/,
    requiredPackages: [
      {
        name: "@testing-library/react",
        installCommand: "npm install -D @testing-library/react",
        description:
          "Reactコンポーネントのレンダリング・操作テスト用ライブラリ",
      },
      {
        name: "@testing-library/jest-dom",
        installCommand: "npm install -D @testing-library/jest-dom",
        description: "DOM要素のカスタムマッチャー（toBeInTheDocument等）",
      },
      {
        name: "jsdom",
        alternatives: ["happy-dom"],
        installCommand: "npm install -D jsdom",
        description: "ブラウザ環境のシミュレーション",
      },
    ],
    requiredConfigs: [
      {
        name: "jsdom environment",
        detectPattern: "environment.*jsdom|environment.*happy-dom",
        description: "テスト設定にブラウザ環境(jsdom)を指定する必要があります",
        configExample:
          "// vitest.config.ts\nexport default defineConfig({ test: { environment: 'jsdom' } })",
      },
    ],
  },
  // Unit tests for .ts files need a test framework
  {
    testType: "unit",
    filePattern: /\.(ts|js)$/,
    requiredPackages: [
      {
        name: "vitest",
        alternatives: ["jest", "mocha"],
        installCommand: "npm install -D vitest",
        description: "テストフレームワーク",
      },
    ],
    requiredConfigs: [],
  },
  // Integration tests need a test framework
  {
    testType: "integration",
    filePattern: /\.(ts|js)$/,
    requiredPackages: [
      {
        name: "vitest",
        alternatives: ["jest", "mocha"],
        installCommand: "npm install -D vitest",
        description: "テストフレームワーク",
      },
    ],
    requiredConfigs: [],
  },
  // E2E tests for non-React files need Playwright or Cypress
  {
    testType: "e2e",
    filePattern: /\.(ts|js)$/,
    requiredPackages: [
      {
        name: "@playwright/test",
        alternatives: ["playwright", "cypress"],
        installCommand: "npm install -D @playwright/test",
        description: "E2Eテストフレームワーク",
      },
    ],
    requiredConfigs: [],
  },
];
