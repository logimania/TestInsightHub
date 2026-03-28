import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "events";

const { mockExec, mockExistsSync, mockDetectTestFramework, mockLoadCoverage } =
  vi.hoisted(() => ({
    mockExec: vi.fn(),
    mockExistsSync: vi.fn(),
    mockDetectTestFramework: vi.fn(),
    mockLoadCoverage: vi.fn(),
  }));

vi.mock("child_process", () => ({
  default: { exec: mockExec },
  exec: mockExec,
}));
vi.mock("fs", () => ({
  default: { existsSync: mockExistsSync },
  existsSync: mockExistsSync,
}));
const { mockDetectAllFrameworks } = vi.hoisted(() => ({
  mockDetectAllFrameworks: vi.fn(),
}));

vi.mock("../../../src/main/services/test-runner/framework-detector", () => ({
  detectTestFramework: mockDetectTestFramework,
  detectAllFrameworks: mockDetectAllFrameworks,
}));
vi.mock("../../../src/main/services/coverage-analyzer", () => ({
  loadCoverage: mockLoadCoverage,
}));

import { runTestsWithCoverage, runAllTestsWithCoverage } from "../../../src/main/services/test-runner/index";

interface MockChild extends EventEmitter {
  stdout: EventEmitter | null;
  stderr: EventEmitter | null;
  kill: ReturnType<typeof vi.fn>;
}

function createMockChild(options?: {
  stdoutData?: string;
  stderrData?: string;
  exitCode?: number;
  emitError?: Error;
}): MockChild {
  const child = new EventEmitter() as MockChild;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = vi.fn();

  // Emit data and close asynchronously (but immediately via microtask)
  Promise.resolve().then(() => {
    if (options?.stdoutData) {
      child.stdout!.emit("data", options.stdoutData);
    }
    if (options?.stderrData) {
      child.stderr!.emit("data", options.stderrData);
    }
    if (options?.emitError) {
      child.emit("error", options.emitError);
    } else {
      child.emit("close", options?.exitCode ?? 0);
    }
  });

  return child;
}

const VITEST_FRAMEWORK = {
  framework: "vitest" as const,
  testCommand: "npx vitest run",
  coverageCommand: "npx vitest run --coverage",
  reportPath: "/project/coverage/coverage-final.json",
  confidence: "high" as const,
  testType: "unit" as const,
};

const PLAYWRIGHT_FRAMEWORK = {
  framework: "playwright" as const,
  testCommand: "npx playwright test",
  coverageCommand: "npx playwright test",
  reportPath: "",
  confidence: "high" as const,
  testType: "e2e" as const,
};

const UNKNOWN_FRAMEWORK = {
  framework: "unknown" as const,
  testCommand: "",
  coverageCommand: "",
  reportPath: "",
  confidence: "low" as const,
  testType: "unit" as const,
};

describe("runTestsWithCoverage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("detects framework and runs the coverage command", async () => {
    mockDetectTestFramework.mockResolvedValue(VITEST_FRAMEWORK);
    mockExec.mockImplementation(() => createMockChild({ exitCode: 0 }));
    mockExistsSync.mockReturnValue(false);
    mockLoadCoverage.mockRejectedValue(new Error("no report"));

    const result = await runTestsWithCoverage({ rootPath: "/project" });

    expect(mockDetectTestFramework).toHaveBeenCalledWith("/project");
    expect(mockExec).toHaveBeenCalled();
    expect(result.framework).toEqual(VITEST_FRAMEWORK);
    expect(result.exitCode).toBe(0);
  });

  it("uses customCommand when provided instead of detected command", async () => {
    mockDetectTestFramework.mockResolvedValue(VITEST_FRAMEWORK);
    mockExec.mockImplementation(() => createMockChild({ exitCode: 0 }));
    mockExistsSync.mockReturnValue(false);
    mockLoadCoverage.mockRejectedValue(new Error("no report"));

    await runTestsWithCoverage({
      rootPath: "/project",
      customCommand: "npm test -- --coverage",
    });

    const execCall = mockExec.mock.calls[0];
    expect(execCall[0]).toBe("npm test -- --coverage");
  });

  it("throws when framework is unknown and no custom command", async () => {
    mockDetectTestFramework.mockResolvedValue(UNKNOWN_FRAMEWORK);

    await expect(
      runTestsWithCoverage({ rootPath: "/project" }),
    ).rejects.toMatchObject({
      code: "COVERAGE_NOT_LOADED",
      recoverable: true,
    });
  });

  it("captures stdout and stderr from the child process", async () => {
    mockDetectTestFramework.mockResolvedValue(VITEST_FRAMEWORK);
    mockExec.mockImplementation(() =>
      createMockChild({
        stdoutData: "PASS all tests\n",
        stderrData: "warning: deprecated\n",
        exitCode: 0,
      }),
    );
    mockExistsSync.mockReturnValue(false);
    mockLoadCoverage.mockRejectedValue(new Error("no report"));

    const result = await runTestsWithCoverage({ rootPath: "/project" });

    expect(result.stdout).toContain("PASS all tests");
    expect(result.stderr).toContain("warning: deprecated");
  });

  it("calls onOutput callback for stdout and stderr lines", async () => {
    mockDetectTestFramework.mockResolvedValue(VITEST_FRAMEWORK);
    mockExec.mockImplementation(() =>
      createMockChild({ stdoutData: "test output\n", exitCode: 0 }),
    );
    mockExistsSync.mockReturnValue(false);
    mockLoadCoverage.mockRejectedValue(new Error("no report"));

    const outputLines: Array<{ line: string; stream: string }> = [];
    await runTestsWithCoverage({
      rootPath: "/project",
      onOutput: (line, stream) => outputLines.push({ line, stream }),
    });

    const stdoutLines = outputLines.filter((o) => o.stream === "stdout");
    expect(stdoutLines.some((o) => o.line.includes("Detected framework"))).toBe(
      true,
    );
    expect(stdoutLines.some((o) => o.line.includes("Running:"))).toBe(true);
  });

  it("reports non-zero exit code from test process", async () => {
    mockDetectTestFramework.mockResolvedValue(VITEST_FRAMEWORK);
    mockExec.mockImplementation(() => createMockChild({ exitCode: 1 }));
    mockExistsSync.mockReturnValue(false);
    mockLoadCoverage.mockRejectedValue(new Error("no report"));

    const result = await runTestsWithCoverage({ rootPath: "/project" });

    expect(result.exitCode).toBe(1);
  });

  it("handles child process error event gracefully", async () => {
    mockDetectTestFramework.mockResolvedValue(VITEST_FRAMEWORK);
    mockExec.mockImplementation(() =>
      createMockChild({ emitError: new Error("command not found") }),
    );
    mockExistsSync.mockReturnValue(false);
    mockLoadCoverage.mockRejectedValue(new Error("no report"));

    const result = await runTestsWithCoverage({ rootPath: "/project" });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("command not found");
  });

  it("includes durationMs in the result", async () => {
    mockDetectTestFramework.mockResolvedValue(VITEST_FRAMEWORK);
    mockExec.mockImplementation(() => createMockChild({ exitCode: 0 }));
    mockExistsSync.mockReturnValue(false);
    mockLoadCoverage.mockRejectedValue(new Error("no report"));

    const result = await runTestsWithCoverage({ rootPath: "/project" });

    expect(typeof result.durationMs).toBe("number");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  describe("coverage loading", () => {
    it("loads coverage when report path exists on disk", async () => {
      mockDetectTestFramework.mockResolvedValue(VITEST_FRAMEWORK);
      mockExec.mockImplementation(() => createMockChild({ exitCode: 0 }));
      mockExistsSync.mockReturnValue(true);
      mockLoadCoverage.mockResolvedValue({
        coverage: {
          reportFormat: "istanbul",
          files: [{ filePath: "a.ts" }],
          generatedAt: "",
        },
        unmatchedFiles: [],
        matchRate: 100,
      });

      const result = await runTestsWithCoverage({ rootPath: "/project" });

      expect(result.coverageResult).not.toBeNull();
      expect(result.coverageResult!.coverage.files.length).toBe(1);
      expect(mockLoadCoverage).toHaveBeenCalledWith({
        rootPath: "/project",
        reportPath: VITEST_FRAMEWORK.reportPath,
      });
    });

    it("falls back to auto-detect when report path does not exist", async () => {
      mockDetectTestFramework.mockResolvedValue(VITEST_FRAMEWORK);
      mockExec.mockImplementation(() => createMockChild({ exitCode: 0 }));
      mockExistsSync.mockReturnValue(false);
      mockLoadCoverage.mockResolvedValue({
        coverage: {
          reportFormat: "istanbul",
          files: [{ filePath: "b.ts" }],
          generatedAt: "",
        },
        unmatchedFiles: [],
        matchRate: 100,
      });

      const result = await runTestsWithCoverage({ rootPath: "/project" });

      expect(mockLoadCoverage).toHaveBeenCalledWith({
        rootPath: "/project",
        autoDetect: true,
      });
      expect(result.coverageResult).not.toBeNull();
    });

    it("sets coverageResult to null when auto-detect fails", async () => {
      mockDetectTestFramework.mockResolvedValue(VITEST_FRAMEWORK);
      mockExec.mockImplementation(() => createMockChild({ exitCode: 0 }));
      mockExistsSync.mockReturnValue(false);
      mockLoadCoverage.mockRejectedValue(new Error("not found"));

      const result = await runTestsWithCoverage({ rootPath: "/project" });

      expect(result.coverageResult).toBeNull();
    });

    it("sets coverageResult to null when report exists but parsing fails", async () => {
      mockDetectTestFramework.mockResolvedValue(VITEST_FRAMEWORK);
      mockExec.mockImplementation(() => createMockChild({ exitCode: 0 }));
      mockExistsSync.mockReturnValue(true);
      mockLoadCoverage.mockRejectedValue(new Error("parse error"));

      const outputLines: Array<{ line: string; stream: string }> = [];
      const result = await runTestsWithCoverage({
        rootPath: "/project",
        onOutput: (line, stream) => outputLines.push({ line, stream }),
      });

      expect(result.coverageResult).toBeNull();
      const stderrLines = outputLines.filter((o) => o.stream === "stderr");
      expect(stderrLines.some((o) => o.line.includes("failed to parse"))).toBe(
        true,
      );
    });
  });

  describe("timeout handling", () => {
    it("resolves with exit code 124 and TIMEOUT marker on timeout", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      mockDetectTestFramework.mockResolvedValue(VITEST_FRAMEWORK);

      // Create a child that never completes
      const child = new EventEmitter() as MockChild;
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.kill = vi.fn();

      mockExec.mockImplementation(() => child);
      mockExistsSync.mockReturnValue(false);
      mockLoadCoverage.mockRejectedValue(new Error("no report"));

      const promise = runTestsWithCoverage({
        rootPath: "/project",
        timeoutMs: 1000,
      });

      // Advance past the timeout
      await vi.advanceTimersByTimeAsync(1500);

      const result = await promise;

      expect(result.exitCode).toBe(124);
      expect(result.stderr).toContain("[TIMEOUT]");
      expect(child.kill).toHaveBeenCalledWith("SIGKILL");
    });
  });

  it("passes correct exec options including cwd and env", async () => {
    mockDetectTestFramework.mockResolvedValue(VITEST_FRAMEWORK);
    mockExec.mockImplementation(() => createMockChild({ exitCode: 0 }));
    mockExistsSync.mockReturnValue(false);
    mockLoadCoverage.mockRejectedValue(new Error("no report"));

    await runTestsWithCoverage({ rootPath: "/my/project" });

    const execOptions = mockExec.mock.calls[0][1];
    expect(execOptions.cwd).toBe("/my/project");
    expect(execOptions.env.CI).toBe("true");
    expect(execOptions.env.FORCE_COLOR).toBe("0");
    expect(execOptions.windowsHide).toBe(true);
  });
});

describe("runAllTestsWithCoverage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("runs all detected frameworks and merges coverage", async () => {
    mockDetectAllFrameworks.mockResolvedValue([VITEST_FRAMEWORK, PLAYWRIGHT_FRAMEWORK]);
    mockExec.mockImplementation(() => createMockChild({ exitCode: 0 }));
    mockExistsSync.mockReturnValue(true);
    mockLoadCoverage.mockResolvedValue({
      coverage: {
        reportFormat: "istanbul",
        files: [{ filePath: "src/a.ts", lineCoverage: { covered: 80, total: 100, percentage: 80 }, branchCoverage: null, functionCoverage: { covered: 80, total: 100, percentage: 80 }, uncoveredLines: [], uncoveredFunctions: [], coveredByTests: [] }],
        generatedAt: "",
      },
      unmatchedFiles: [],
      matchRate: 100,
    });

    const result = await runAllTestsWithCoverage({ rootPath: "/project" });

    expect(mockExec).toHaveBeenCalledTimes(2);
    expect(result.coverageResult).not.toBeNull();
  });

  it("throws when no frameworks detected", async () => {
    mockDetectAllFrameworks.mockResolvedValue([]);

    await expect(
      runAllTestsWithCoverage({ rootPath: "/project" }),
    ).rejects.toMatchObject({
      code: "COVERAGE_NOT_LOADED",
    });
  });

  it("runs single framework when only one detected", async () => {
    mockDetectAllFrameworks.mockResolvedValue([VITEST_FRAMEWORK]);
    mockExec.mockImplementation(() => createMockChild({ exitCode: 0 }));
    mockExistsSync.mockReturnValue(false);
    mockLoadCoverage.mockRejectedValue(new Error("no report"));

    const result = await runAllTestsWithCoverage({ rootPath: "/project" });

    expect(mockExec).toHaveBeenCalledTimes(1);
    expect(result.framework).toEqual(VITEST_FRAMEWORK);
  });

  it("skips framework with no command", async () => {
    const noCommandFw = { ...PLAYWRIGHT_FRAMEWORK, coverageCommand: "" };
    mockDetectAllFrameworks.mockResolvedValue([VITEST_FRAMEWORK, noCommandFw]);
    mockExec.mockImplementation(() => createMockChild({ exitCode: 0 }));
    mockExistsSync.mockReturnValue(false);
    mockLoadCoverage.mockRejectedValue(new Error("no report"));

    await runAllTestsWithCoverage({ rootPath: "/project" });

    expect(mockExec).toHaveBeenCalledTimes(1);
  });

  it("merges coverage from multiple frameworks", async () => {
    mockDetectAllFrameworks.mockResolvedValue([VITEST_FRAMEWORK, PLAYWRIGHT_FRAMEWORK]);
    mockExec.mockImplementation(() => createMockChild({ exitCode: 0 }));
    mockExistsSync.mockImplementation((p: string) => p.includes("coverage-final"));

    let callCount = 0;
    mockLoadCoverage.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          coverage: {
            reportFormat: "istanbul",
            files: [{ filePath: "src/a.ts", lineCoverage: { covered: 50, total: 100, percentage: 50 }, branchCoverage: null, functionCoverage: { covered: 50, total: 100, percentage: 50 }, uncoveredLines: [], uncoveredFunctions: [], coveredByTests: [] }],
            generatedAt: "",
          },
          unmatchedFiles: [],
          matchRate: 100,
        });
      }
      return Promise.reject(new Error("no e2e coverage"));
    });

    const result = await runAllTestsWithCoverage({ rootPath: "/project" });

    expect(result.coverageResult).not.toBeNull();
    expect(result.coverageResult!.coverage.files.length).toBe(1);
  });

  it("uses customCommand only for first framework", async () => {
    mockDetectAllFrameworks.mockResolvedValue([VITEST_FRAMEWORK, PLAYWRIGHT_FRAMEWORK]);
    mockExec.mockImplementation(() => createMockChild({ exitCode: 0 }));
    mockExistsSync.mockReturnValue(false);
    mockLoadCoverage.mockRejectedValue(new Error("no report"));

    await runAllTestsWithCoverage({
      rootPath: "/project",
      customCommand: "custom-test-cmd",
    });

    expect(mockExec.mock.calls[0][0]).toBe("custom-test-cmd");
    expect(mockExec.mock.calls[1][0]).toBe("npx playwright test");
  });
});
