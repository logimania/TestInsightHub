import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";

export type TestFramework =
  | "vitest"
  | "jest"
  | "pytest"
  | "go"
  | "cargo"
  | "playwright"
  | "unknown";

export interface DetectedFramework {
  readonly framework: TestFramework;
  readonly testCommand: string;
  readonly coverageCommand: string;
  readonly reportPath: string;
  readonly confidence: "high" | "medium" | "low";
  readonly testType: "unit" | "e2e";
}

export async function detectTestFramework(
  rootPath: string,
): Promise<DetectedFramework> {
  const frameworks = await detectAllFrameworks(rootPath);
  return frameworks[0] ?? {
    framework: "unknown",
    testCommand: "",
    coverageCommand: "",
    reportPath: "",
    confidence: "low",
    testType: "unit",
  };
}

/**
 * プロジェクト内の全テストフレームワークを検出する。
 * unit系（vitest/jest/pytest/go/cargo）とe2e系（playwright）の両方を検出。
 */
export async function detectAllFrameworks(
  rootPath: string,
): Promise<DetectedFramework[]> {
  const frameworks: DetectedFramework[] = [];

  // Check Node.js projects
  const packageJsonPath = join(rootPath, "package.json");
  if (existsSync(packageJsonPath)) {
    const content = await readFile(packageJsonPath, "utf-8");
    const pkg = JSON.parse(content);
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    if (allDeps["vitest"]) {
      frameworks.push({
        framework: "vitest",
        testCommand: "npx vitest run",
        coverageCommand:
          "npx vitest run --coverage --reporter=json --coverage.reporter=json",
        reportPath: join(rootPath, "coverage", "coverage-final.json"),
        confidence: "high",
        testType: "unit",
      });
    }

    if (allDeps["jest"]) {
      frameworks.push({
        framework: "jest",
        testCommand: "npx jest",
        coverageCommand: "npx jest --coverage --coverageReporters=json",
        reportPath: join(rootPath, "coverage", "coverage-final.json"),
        confidence: "high",
        testType: "unit",
      });
    }

    // Playwright detection
    if (allDeps["@playwright/test"] || allDeps["playwright"]) {
      const configExists =
        existsSync(join(rootPath, "playwright.config.ts")) ||
        existsSync(join(rootPath, "playwright.config.js"));
      if (configExists) {
        frameworks.push({
          framework: "playwright",
          testCommand: "npx playwright test",
          coverageCommand: "npx playwright test",
          reportPath: join(rootPath, "coverage", "e2e-coverage.json"),
          confidence: "high",
          testType: "e2e",
        });
      }
    }
  }

  // Check Python projects
  const pyprojectPath = join(rootPath, "pyproject.toml");
  const setupCfgPath = join(rootPath, "setup.cfg");
  const pytestIniPath = join(rootPath, "pytest.ini");
  if (
    existsSync(pyprojectPath) ||
    existsSync(setupCfgPath) ||
    existsSync(pytestIniPath)
  ) {
    const hasPytest = await checkPyprojectForPytest(rootPath);
    if (hasPytest || existsSync(pytestIniPath)) {
      frameworks.push({
        framework: "pytest",
        testCommand: "pytest",
        coverageCommand: "pytest --cov --cov-report=json:coverage.json",
        reportPath: join(rootPath, "coverage.json"),
        confidence: existsSync(pytestIniPath) ? "high" : "medium",
        testType: "unit",
      });
    }
  }

  // Check Go projects
  const goModPath = join(rootPath, "go.mod");
  if (existsSync(goModPath)) {
    frameworks.push({
      framework: "go",
      testCommand: "go test ./...",
      coverageCommand: "go test -coverprofile=cover.out ./...",
      reportPath: join(rootPath, "cover.out"),
      confidence: "high",
      testType: "unit",
    });
  }

  // Check Rust projects
  const cargoTomlPath = join(rootPath, "Cargo.toml");
  if (existsSync(cargoTomlPath)) {
    frameworks.push({
      framework: "cargo",
      testCommand: "cargo test",
      coverageCommand: "cargo llvm-cov --json --output-path=llvm-cov.json",
      reportPath: join(rootPath, "llvm-cov.json"),
      confidence: "medium",
      testType: "unit",
    });
  }

  return frameworks;
}

async function checkPyprojectForPytest(rootPath: string): Promise<boolean> {
  try {
    const content = await readFile(join(rootPath, "pyproject.toml"), "utf-8");
    return (
      content.includes("pytest") ||
      content.includes("tool.pytest") ||
      content.includes("tool.coverage")
    );
  } catch {
    return false;
  }
}
