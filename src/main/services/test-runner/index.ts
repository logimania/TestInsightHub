import { exec } from "child_process";
import { existsSync } from "fs";
import type { BrowserWindow } from "electron";
import {
  detectTestFramework,
  detectAllFrameworks,
  type DetectedFramework,
} from "./framework-detector";
import { loadCoverage, type LoadCoverageResult } from "../coverage-analyzer";
import type { FileCoverage, NormalizedCoverage } from "@shared/types/coverage";
import { AppErrorImpl } from "@shared/types/errors";

export interface TestRunResult {
  readonly framework: DetectedFramework;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly durationMs: number;
  readonly coverageResult: LoadCoverageResult | null;
}

export interface TestRunOptions {
  readonly rootPath: string;
  readonly customCommand?: string;
  readonly timeoutMs?: number;
  readonly onOutput?: (line: string, stream: "stdout" | "stderr") => void;
}

const DEFAULT_TIMEOUT_MS = 300_000; // 5 minutes

export async function runTestsWithCoverage(
  options: TestRunOptions,
): Promise<TestRunResult> {
  const { rootPath, timeoutMs = DEFAULT_TIMEOUT_MS, onOutput } = options;

  // Detect or use custom command
  const framework = await detectTestFramework(rootPath);

  const command = options.customCommand ?? framework.coverageCommand;

  if (!command) {
    throw new AppErrorImpl({
      code: "COVERAGE_NOT_LOADED",
      message:
        "テストフレームワークを自動検出できませんでした。テスト実行コマンドを入力してください。",
      recoverable: true,
    });
  }

  onOutput?.(`Detected framework: ${framework.framework}`, "stdout");
  onOutput?.(`Running: ${command}`, "stdout");

  // Execute tests
  const startTime = Date.now();
  const { exitCode, stdout, stderr } = await executeCommand(
    command,
    rootPath,
    timeoutMs,
    onOutput,
  );
  const durationMs = Date.now() - startTime;

  onOutput?.(
    `Test completed in ${(durationMs / 1000).toFixed(1)}s (exit code: ${exitCode})`,
    "stdout",
  );

  // Try to load coverage report
  let coverageResult: LoadCoverageResult | null = null;
  const reportPath = framework.reportPath;

  if (reportPath && existsSync(reportPath)) {
    try {
      coverageResult = await loadCoverage({
        rootPath,
        reportPath,
      });
      onOutput?.(
        `Coverage loaded: ${coverageResult.coverage.files.length} files`,
        "stdout",
      );
    } catch (err) {
      onOutput?.(
        `Coverage report found but failed to parse: ${err instanceof Error ? err.message : String(err)}`,
        "stderr",
      );
    }
  } else {
    // Try auto-detection as fallback
    try {
      coverageResult = await loadCoverage({
        rootPath,
        autoDetect: true,
      });
      onOutput?.(
        `Coverage auto-detected: ${coverageResult.coverage.files.length} files`,
        "stdout",
      );
    } catch {
      onOutput?.(
        "Coverage report not found. Check test framework coverage settings.",
        "stderr",
      );
    }
  }

  return {
    framework,
    exitCode,
    stdout,
    stderr,
    durationMs,
    coverageResult,
  };
}

/**
 * プロジェクト内の全テストフレームワーク（unit + e2e）を検出し、
 * 順番に実行してカバレッジをマージする。
 */
export async function runAllTestsWithCoverage(
  options: TestRunOptions,
): Promise<TestRunResult> {
  const { rootPath, timeoutMs = DEFAULT_TIMEOUT_MS, onOutput } = options;

  const frameworks = await detectAllFrameworks(rootPath);

  if (frameworks.length === 0) {
    throw new AppErrorImpl({
      code: "COVERAGE_NOT_LOADED",
      message:
        "テストフレームワークを自動検出できませんでした。テスト実行コマンドを入力してください。",
      recoverable: true,
    });
  }

  onOutput?.(
    `検出されたフレームワーク: ${frameworks.map((f) => `${f.framework} (${f.testType})`).join(", ")}`,
    "stdout",
  );

  const allCoverageFiles: FileCoverage[] = [];
  let primaryResult: TestRunResult | null = null;
  let reportFormat: string = "istanbul";

  for (const fw of frameworks) {
    onOutput?.(`\n--- ${fw.framework} (${fw.testType}) を実行中 ---`, "stdout");

    const command = options.customCommand && fw === frameworks[0]
      ? options.customCommand
      : fw.coverageCommand;

    if (!command) {
      onOutput?.(`${fw.framework}: コマンドなし、スキップ`, "stderr");
      continue;
    }

    const startTime = Date.now();
    const { exitCode, stdout, stderr } = await executeCommand(
      command,
      rootPath,
      timeoutMs,
      onOutput,
    );
    const durationMs = Date.now() - startTime;

    onOutput?.(
      `${fw.framework} 完了 (${(durationMs / 1000).toFixed(1)}秒, exit: ${exitCode})`,
      "stdout",
    );

    // カバレッジ読み込み
    let coverageResult: LoadCoverageResult | null = null;
    if (fw.reportPath && existsSync(fw.reportPath)) {
      try {
        coverageResult = await loadCoverage({ rootPath, reportPath: fw.reportPath });
        onOutput?.(
          `${fw.framework} カバレッジ: ${coverageResult.coverage.files.length} ファイル`,
          "stdout",
        );
      } catch (err) {
        onOutput?.(
          `${fw.framework} カバレッジ解析失敗: ${err instanceof Error ? err.message : String(err)}`,
          "stderr",
        );
      }
    } else if (fw.testType === "unit") {
      try {
        coverageResult = await loadCoverage({ rootPath, autoDetect: true });
      } catch {
        // no coverage for this framework
      }
    }

    if (coverageResult) {
      reportFormat = coverageResult.coverage.reportFormat;
      allCoverageFiles.push(...coverageResult.coverage.files);
    }

    if (!primaryResult) {
      primaryResult = {
        framework: fw,
        exitCode,
        stdout,
        stderr,
        durationMs,
        coverageResult,
      };
    }
  }

  // マージされたカバレッジを構築
  if (allCoverageFiles.length > 0 && primaryResult) {
    const mergedCoverage: NormalizedCoverage = {
      reportFormat: reportFormat as NormalizedCoverage["reportFormat"],
      files: mergeCoverageFiles(allCoverageFiles),
      generatedAt: new Date().toISOString(),
    };
    const mergedResult: LoadCoverageResult = {
      coverage: mergedCoverage,
      unmatchedFiles: [],
      matchRate: 100,
    };

    onOutput?.(
      `\nカバレッジマージ完了: ${mergedCoverage.files.length} ファイル`,
      "stdout",
    );

    return { ...primaryResult, coverageResult: mergedResult };
  }

  return primaryResult ?? {
    framework: frameworks[0],
    exitCode: 1,
    stdout: "",
    stderr: "No test results",
    durationMs: 0,
    coverageResult: null,
  };
}

/**
 * 同じファイルパスのカバレッジをマージする。
 * 複数のテストランナーが同じファイルをカバーしている場合、カバレッジを合算する。
 */
function mergeCoverageFiles(
  files: readonly FileCoverage[],
): FileCoverage[] {
  const byPath = new Map<string, FileCoverage>();

  for (const file of files) {
    const existing = byPath.get(file.filePath);
    if (!existing) {
      byPath.set(file.filePath, file);
    } else {
      // カバー数を合算（重複行は大きい方を採用）
      byPath.set(file.filePath, {
        filePath: file.filePath,
        lineCoverage: {
          covered: Math.max(existing.lineCoverage.covered, file.lineCoverage.covered),
          total: Math.max(existing.lineCoverage.total, file.lineCoverage.total),
          percentage: Math.max(existing.lineCoverage.percentage, file.lineCoverage.percentage),
        },
        branchCoverage: existing.branchCoverage ?? file.branchCoverage,
        functionCoverage: {
          covered: Math.max(existing.functionCoverage.covered, file.functionCoverage.covered),
          total: Math.max(existing.functionCoverage.total, file.functionCoverage.total),
          percentage: Math.max(existing.functionCoverage.percentage, file.functionCoverage.percentage),
        },
        uncoveredLines: existing.uncoveredLines.length < file.uncoveredLines.length
          ? existing.uncoveredLines
          : file.uncoveredLines,
        uncoveredFunctions: existing.uncoveredFunctions.length < file.uncoveredFunctions.length
          ? existing.uncoveredFunctions
          : file.uncoveredFunctions,
        coveredByTests: [...existing.coveredByTests, ...file.coveredByTests],
      });
    }
  }

  return [...byPath.values()];
}

function executeCommand(
  command: string,
  cwd: string,
  timeoutMs: number,
  onOutput?: (line: string, stream: "stdout" | "stderr") => void,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let stdout = "";
    let stderr = "";

    const child = exec(command, {
      cwd,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      env: { ...process.env, FORCE_COLOR: "0", CI: "true" },
      windowsHide: true,
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
    });

    // Manual timeout (exec timeout is unreliable on Windows)
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        child.kill("SIGKILL");
      } catch {
        // ignore
      }
      onOutput?.(`タイムアウト (${timeoutMs / 1000}秒)`, "stderr");
      resolve({ exitCode: 124, stdout, stderr: stderr + "\n[TIMEOUT]" });
    }, timeoutMs);

    child.stdout?.on("data", (data: Buffer | string) => {
      const text = data.toString();
      stdout += text;
      for (const line of text.split("\n")) {
        if (line.trim()) onOutput?.(line, "stdout");
      }
    });

    child.stderr?.on("data", (data: Buffer | string) => {
      const text = data.toString();
      stderr += text;
      for (const line of text.split("\n")) {
        if (line.trim()) onOutput?.(line, "stderr");
      }
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      onOutput?.(`エラー: ${err.message}`, "stderr");
      resolve({ exitCode: 1, stdout, stderr: stderr + "\n" + err.message });
    });
  });
}
