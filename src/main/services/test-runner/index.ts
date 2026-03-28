import { exec } from "child_process";
import { existsSync } from "fs";
import type { BrowserWindow } from "electron";
import {
  detectTestFramework,
  type DetectedFramework,
} from "./framework-detector";
import { loadCoverage, type LoadCoverageResult } from "../coverage-analyzer";
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
