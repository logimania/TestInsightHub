import type { ParsedFile } from "@shared/types/project";
import type {
  FileCoverage,
  TestReference,
  TestType,
} from "@shared/types/coverage";
import { isTestFile } from "./test-classifier";
import { classifyTestType } from "./test-classifier";
import { dirname, basename } from "path";

/**
 * テストファイルのimport解析結果を使って、
 * 各ソースファイルがどのテストファイル（どの種別）でカバーされているかを紐付ける。
 */
export function mapTestsToCoverage(
  allFiles: readonly ParsedFile[],
  coverageFiles: FileCoverage[],
): FileCoverage[] {
  // テストファイルとソースファイルを分離
  const testFiles = allFiles.filter((f) => isTestFile(f.path));
  const sourceFiles = allFiles.filter((f) => !isTestFile(f.path));

  // テストファイル → カバーしているソースファイルパスのマップ
  const testToSourceMap = buildTestToSourceMap(testFiles, sourceFiles);

  // ソースファイルパス → テスト参照のマップ（逆引き）
  const sourceToTestsMap = new Map<string, TestReference[]>();

  for (const [testFile, sourceFilePaths] of testToSourceMap) {
    const testType = classifyTestType(testFile.path);

    for (const sourcePath of sourceFilePaths) {
      if (!sourceToTestsMap.has(sourcePath)) {
        sourceToTestsMap.set(sourcePath, []);
      }
      sourceToTestsMap.get(sourcePath)!.push({
        testFilePath: testFile.path,
        testName: basename(testFile.path),
        testType,
      });
    }
  }

  // カバレッジデータにテスト参照を付与
  return coverageFiles.map((file) => {
    const tests = sourceToTestsMap.get(file.filePath);
    if (!tests || tests.length === 0) {
      return file;
    }
    // 重複除去
    const uniqueTests = deduplicateTests(tests);
    return { ...file, coveredByTests: uniqueTests };
  });
}

function buildTestToSourceMap(
  testFiles: readonly ParsedFile[],
  sourceFiles: readonly ParsedFile[],
): Map<ParsedFile, string[]> {
  const sourcePathSet = new Set(sourceFiles.map((f) => f.path));
  const sourceByBaseName = buildBaseNameIndex(sourceFiles);
  const map = new Map<ParsedFile, string[]>();

  for (const testFile of testFiles) {
    const coveredSources: string[] = [];

    // 1. import 解析による直接マッチ
    for (const imp of testFile.imports) {
      const resolved = resolveTestImport(testFile.path, imp, sourcePathSet);
      if (resolved) {
        coveredSources.push(resolved);
      }
    }

    // 2. ファイル名の命名規約によるマッチ
    const conventionMatch = matchByNamingConvention(
      testFile.path,
      sourceByBaseName,
    );
    if (conventionMatch && !coveredSources.includes(conventionMatch)) {
      coveredSources.push(conventionMatch);
    }

    if (coveredSources.length > 0) {
      map.set(testFile, coveredSources);
    }
  }

  return map;
}

/**
 * テストファイルのimportパスを解決してソースファイルパスに変換する
 */
function resolveTestImport(
  testFilePath: string,
  importPath: string,
  sourcePathSet: Set<string>,
): string | null {
  if (!importPath.startsWith(".")) return null;

  const testDir = dirname(testFilePath);
  const parts = testDir.split("/").concat(importPath.split("/"));
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "..") resolved.pop();
    else if (part !== "." && part !== "") resolved.push(part);
  }

  const base = resolved.join("/");

  // 拡張子付きで直接マッチ
  if (sourcePathSet.has(base)) return base;

  // 拡張子を補完してマッチ
  const extensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".py",
    ".go",
    ".rs",
    ".c",
    ".cpp",
  ];
  for (const ext of extensions) {
    if (sourcePathSet.has(base + ext)) return base + ext;
  }

  // index ファイルのマッチ
  for (const ext of extensions) {
    if (sourcePathSet.has(base + "/index" + ext)) return base + "/index" + ext;
  }

  return null;
}

/**
 * テストファイル名から対応するソースファイルを推定する命名規約マッチ
 * 例: user-repo.test.ts → user-repo.ts
 *     test_handler.py → handler.py
 *     handler_test.go → handler.go
 */
function matchByNamingConvention(
  testFilePath: string,
  sourceByBaseName: Map<string, string>,
): string | null {
  const testFileName = basename(testFilePath);

  // *.test.ts, *.spec.ts → *
  let sourceName = testFileName.replace(/\.(test|spec)\.[^.]+$/, "");

  // test_*.py → *
  if (sourceName === testFileName) {
    sourceName = testFileName.replace(/^test_/, "");
  }

  // *_test.go, *_test.py → *
  if (sourceName === testFileName) {
    sourceName = testFileName.replace(/_test(\.[^.]+)$/, "$1");
  }

  // 拡張子を除去してベース名で検索
  const baseWithoutExt = sourceName.replace(/\.[^.]+$/, "");
  return sourceByBaseName.get(baseWithoutExt) ?? null;
}

function buildBaseNameIndex(
  sourceFiles: readonly ParsedFile[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const file of sourceFiles) {
    const name = basename(file.path);
    const base = name.replace(/\.[^.]+$/, "");
    // 最初に見つかったものを優先（同名ファイルが複数ある場合）
    if (!map.has(base)) {
      map.set(base, file.path);
    }
  }
  return map;
}

function deduplicateTests(tests: TestReference[]): TestReference[] {
  const seen = new Set<string>();
  return tests.filter((t) => {
    const key = `${t.testFilePath}:${t.testType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
