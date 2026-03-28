import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";

export type TestFramework =
  | "vitest"
  | "jest"
  | "pytest"
  | "go"
  | "cargo"
  | "unknown";

export interface DetectedFramework {
  readonly framework: TestFramework;
  readonly testCommand: string;
  readonly coverageCommand: string;
  readonly reportPath: string;
  readonly confidence: "high" | "medium" | "low";
}

export async function detectTestFramework(
  rootPath: string,
): Promise<DetectedFramework> {
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
      return {
        framework: "vitest",
        testCommand: "npx vitest run",
        coverageCommand:
          "npx vitest run --coverage --reporter=json --coverage.reporter=json",
        reportPath: join(rootPath, "coverage", "coverage-final.json"),
        confidence: "high",
      };
    }

    if (allDeps["jest"]) {
      return {
        framework: "jest",
        testCommand: "npx jest",
        coverageCommand: "npx jest --coverage --coverageReporters=json",
        reportPath: join(rootPath, "coverage", "coverage-final.json"),
        confidence: "high",
      };
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
      return {
        framework: "pytest",
        testCommand: "pytest",
        coverageCommand: "pytest --cov --cov-report=json:coverage.json",
        reportPath: join(rootPath, "coverage.json"),
        confidence: existsSync(pytestIniPath) ? "high" : "medium",
      };
    }
  }

  // Check Go projects
  const goModPath = join(rootPath, "go.mod");
  if (existsSync(goModPath)) {
    return {
      framework: "go",
      testCommand: "go test ./...",
      coverageCommand: "go test -coverprofile=cover.out ./...",
      reportPath: join(rootPath, "cover.out"),
      confidence: "high",
    };
  }

  // Check Rust projects
  const cargoTomlPath = join(rootPath, "Cargo.toml");
  if (existsSync(cargoTomlPath)) {
    return {
      framework: "cargo",
      testCommand: "cargo test",
      coverageCommand: "cargo llvm-cov --json --output-path=llvm-cov.json",
      reportPath: join(rootPath, "llvm-cov.json"),
      confidence: "medium",
    };
  }

  return {
    framework: "unknown",
    testCommand: "",
    coverageCommand: "",
    reportPath: "",
    confidence: "low",
  };
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
