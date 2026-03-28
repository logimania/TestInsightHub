import { readFile } from "fs/promises";
import { join, basename } from "path";
import { existsSync } from "fs";
import type { NormalizedCoverage, FileCoverage } from "@shared/types/coverage";
import type { ProjectStructure } from "@shared/types/project";
import type { PathMapping } from "@shared/types/settings";
import { COVERAGE_AUTO_DETECT_PATHS } from "@shared/constants";
import { detectReportFormat, detectByFilename } from "./report-detector";
import {
  parseReport,
  applyPathMappings,
  matchWithSourceFiles,
} from "./normalizer";
import { AppErrorImpl } from "@shared/types/errors";

export interface LoadCoverageOptions {
  readonly rootPath: string;
  readonly reportPath?: string;
  readonly autoDetect?: boolean;
  readonly pathMappings?: readonly PathMapping[];
  readonly projectStructure?: ProjectStructure;
}

export interface LoadCoverageResult {
  readonly coverage: NormalizedCoverage;
  readonly unmatchedFiles: readonly string[];
  readonly matchRate: number;
}

export async function loadCoverage(
  options: LoadCoverageOptions,
): Promise<LoadCoverageResult> {
  const { rootPath, pathMappings = [] } = options;

  const reportPath = options.reportPath ?? autoDetectReport(rootPath);
  if (!reportPath) {
    throw new AppErrorImpl({
      code: "COVERAGE_NOT_LOADED",
      message:
        "カバレッジレポートが見つかりません。手動でファイルを指定してください。",
      recoverable: true,
    });
  }

  let content: string;
  try {
    content = await readFile(reportPath, "utf-8");
  } catch {
    throw new AppErrorImpl({
      code: "COVERAGE_FORMAT_INVALID",
      message: `カバレッジレポートの読み込みに失敗しました: ${reportPath}`,
      recoverable: true,
    });
  }

  const filenameHint = detectByFilename(basename(reportPath));
  const contentDetected = detectReportFormat(content);
  const format = contentDetected ?? filenameHint;

  if (!format) {
    throw new AppErrorImpl({
      code: "COVERAGE_FORMAT_UNKNOWN",
      message:
        "形式を自動判定できません。レポート形式を手動で選択してください。",
      recoverable: true,
    });
  }

  let files: FileCoverage[];
  try {
    files = parseReport(content, format, rootPath);
  } catch (err) {
    throw new AppErrorImpl({
      code: "COVERAGE_FORMAT_INVALID",
      message: `カバレッジレポートの読み込みに失敗しました。ファイル形式を確認してください。検出された形式: ${format}`,
      detail: err instanceof Error ? err.message : String(err),
      recoverable: true,
    });
  }

  files = applyPathMappings(files, pathMappings);

  let unmatchedFiles: string[] = [];
  let matchRate = 100;

  if (options.projectStructure) {
    const sourceFilePaths = options.projectStructure.modules.flatMap((m) =>
      m.files.map((f) => f.path),
    );
    const matchResult = matchWithSourceFiles(files, sourceFilePaths);
    files = matchResult.matched;
    unmatchedFiles = matchResult.unmatched;
    matchRate = matchResult.matchRate;
  }

  return {
    coverage: {
      reportFormat: format,
      files,
      generatedAt: new Date().toISOString(),
    },
    unmatchedFiles,
    matchRate,
  };
}

function autoDetectReport(rootPath: string): string | null {
  for (const relPath of COVERAGE_AUTO_DETECT_PATHS) {
    const fullPath = join(rootPath, relPath);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}
