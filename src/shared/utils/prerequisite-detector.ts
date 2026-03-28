import type { TestType } from "../types/coverage";
import type {
  TestPrerequisite,
  TestPrerequisites,
  ProjectTestEnvironment,
} from "../types/feedback";
import { PREREQUISITE_RULES } from "../constants";

/**
 * ファイルパスとテスト種別から、テストを書くために必要な前提条件を検出する。
 * 純粋関数 — ファイルシステムへのアクセスなし。
 */
export function detectPrerequisites(
  filePath: string,
  testType: TestType,
  env: ProjectTestEnvironment,
): TestPrerequisites {
  const missing: TestPrerequisite[] = [];

  const matchedRules = PREREQUISITE_RULES.filter((rule) => {
    const typeMatch = rule.testType === "any" || rule.testType === testType;
    const fileMatch = rule.filePattern.test(filePath);
    return typeMatch && fileMatch;
  });

  for (const rule of matchedRules) {
    for (const pkg of rule.requiredPackages) {
      const allNames = [pkg.name, ...(pkg.alternatives ?? [])];
      const installed = allNames.some((name) =>
        env.installedPackages.includes(name),
      );
      if (!installed) {
        missing.push({
          type: "package",
          name: pkg.name,
          description: pkg.description,
          installCommand: pkg.installCommand,
        });
      }
    }

    for (const cfg of rule.requiredConfigs) {
      const pattern = new RegExp(cfg.detectPattern);
      const configured = env.configFiles.some((content) =>
        pattern.test(content),
      );
      if (!configured) {
        missing.push({
          type: "config",
          name: cfg.name,
          description: cfg.description,
          configExample: cfg.configExample,
        });
      }
    }
  }

  // 重複除去（同じパッケージが複数ルールでマッチする場合）
  const seen = new Set<string>();
  const deduplicated = missing.filter((item) => {
    const key = `${item.type}:${item.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    satisfied: deduplicated.length === 0,
    missing: deduplicated,
  };
}

/**
 * package.jsonの依存関係と設定ファイル情報からProjectTestEnvironmentを構築する。
 * 純粋関数。
 */
export function buildProjectTestEnvironment(
  deps: Record<string, string>,
  devDeps: Record<string, string>,
  configFileContents: readonly string[],
): ProjectTestEnvironment {
  const installedPackages = [...Object.keys(deps), ...Object.keys(devDeps)];

  const knownFrameworks = [
    "vitest",
    "jest",
    "mocha",
    "@playwright/test",
    "playwright",
    "cypress",
  ];
  const testFramework =
    knownFrameworks.find((fw) => installedPackages.includes(fw)) ?? null;

  let testEnvironment: string | null = null;
  for (const content of configFileContents) {
    if (/environment\s*[:=]\s*['"]jsdom['"]/.test(content)) {
      testEnvironment = "jsdom";
      break;
    }
    if (/environment\s*[:=]\s*['"]happy-dom['"]/.test(content)) {
      testEnvironment = "happy-dom";
      break;
    }
  }

  return {
    installedPackages,
    configFiles: [...configFileContents],
    testFramework,
    testEnvironment,
  };
}
