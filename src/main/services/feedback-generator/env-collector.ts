import { readFile, access } from "fs/promises";
import { join, resolve, normalize } from "path";
import type { ProjectTestEnvironment } from "@shared/types/feedback";
import { buildProjectTestEnvironment } from "@shared/utils/prerequisite-detector";

const CONFIG_FILES = [
  "vitest.config.ts",
  "vitest.config.js",
  "jest.config.ts",
  "jest.config.js",
  "jest.config.mjs",
  "playwright.config.ts",
  "cypress.config.ts",
  "cypress.config.js",
] as const;

/**
 * プロジェクトルートから package.json と設定ファイルを読み取り、
 * テスト環境情報を収集する。
 */
export async function collectProjectTestEnvironment(
  projectRoot: string,
): Promise<ProjectTestEnvironment> {
  const safeRoot = resolve(normalize(projectRoot));
  const packageJson = await readPackageJson(safeRoot);
  const configContents = await readConfigFiles(safeRoot);

  return buildProjectTestEnvironment(
    packageJson.dependencies,
    packageJson.devDependencies,
    configContents,
  );
}

async function readPackageJson(projectRoot: string): Promise<{
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}> {
  try {
    const raw = await readFile(join(projectRoot, "package.json"), "utf-8");
    const parsed = JSON.parse(raw);
    return {
      dependencies: parsed.dependencies ?? {},
      devDependencies: parsed.devDependencies ?? {},
    };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT" && code !== "EACCES") {
      console.warn("[env-collector] Failed to parse package.json:", err);
    }
    return { dependencies: {}, devDependencies: {} };
  }
}

async function readConfigFiles(projectRoot: string): Promise<string[]> {
  const contents: string[] = [];

  for (const fileName of CONFIG_FILES) {
    const filePath = join(projectRoot, fileName);
    try {
      await access(filePath);
      const content = await readFile(filePath, "utf-8");
      contents.push(content);
    } catch {
      // File does not exist — skip
    }
  }

  return contents;
}
