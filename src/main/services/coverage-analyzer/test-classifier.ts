import type { TestType } from "@shared/types/coverage";
import { TEST_DIR_NAMES } from "@shared/constants";

export function classifyTestType(testFilePath: string): TestType {
  const normalized = testFilePath.replace(/\\/g, "/").toLowerCase();
  const parts = normalized.split("/");

  // 1. ディレクトリ名による分類
  for (const part of parts) {
    if (part === "unit" || part === "units") return "unit";
    if (part === "integration" || part === "integrations" || part === "int")
      return "integration";
    if (part === "e2e" || part === "end-to-end" || part === "end2end")
      return "e2e";
  }

  // 2. ファイル名パターンによる分類
  const fileName = parts[parts.length - 1] ?? "";
  if (/\.unit\./i.test(fileName)) return "unit";
  if (/\.int(egration)?\./i.test(fileName)) return "integration";
  if (/\.e2e\./i.test(fileName)) return "e2e";

  // 3. フォールバック
  return "unit";
}

export function isTestFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  const parts = normalized.split("/");

  // テストディレクトリ内
  for (const part of parts) {
    if (TEST_DIR_NAMES.includes(part)) return true;
  }

  // テストファイルパターン
  const fileName = parts[parts.length - 1] ?? "";
  if (/\.(test|spec)\.[jt]sx?$/.test(fileName)) return true;
  if (/^test_.*\.py$/.test(fileName)) return true;
  if (/.*_test\.(py|go|rs)$/.test(fileName)) return true;

  return false;
}
