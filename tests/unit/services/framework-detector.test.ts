import { describe, it, expect } from "vitest";
import { resolve } from "path";
import { detectTestFramework } from "../../../src/main/services/test-runner/framework-detector";

const FIXTURE_PATH = resolve(__dirname, "../../fixtures/sample-project");

describe("framework-detector", () => {
  describe("Node.js projects", () => {
    it("detects vitest from package.json", async () => {
      const mainProjectPath = resolve(__dirname, "../../..");
      const result = await detectTestFramework(mainProjectPath);
      expect(result.framework).toBe("vitest");
      expect(result.confidence).toBe("high");
      expect(result.coverageCommand).toContain("vitest");
      expect(result.testCommand).toContain("vitest");
    });

    it("detects jest from package.json", async () => {
      const jestPath = resolve(__dirname, "../../fixtures/jest-project");
      const result = await detectTestFramework(jestPath);
      expect(result.framework).toBe("jest");
      expect(result.confidence).toBe("high");
      expect(result.testCommand).toContain("jest");
      expect(result.coverageCommand).toContain("jest");
      expect(result.coverageCommand).toContain("--coverage");
      expect(result.reportPath).toContain("coverage-final.json");
    });
  });

  describe("Python projects", () => {
    it("detects pytest from pytest.ini", async () => {
      const pytestPath = resolve(__dirname, "../../fixtures/pytest-project");
      const result = await detectTestFramework(pytestPath);
      expect(result.framework).toBe("pytest");
      expect(result.confidence).toBe("high");
      expect(result.testCommand).toBe("pytest");
      expect(result.coverageCommand).toContain("--cov");
      expect(result.reportPath).toContain("coverage.json");
    });
  });

  describe("Go projects", () => {
    it("detects go test from go.mod", async () => {
      const goPath = resolve(__dirname, "../../fixtures/go-project");
      const result = await detectTestFramework(goPath);
      expect(result.framework).toBe("go");
      expect(result.confidence).toBe("high");
      expect(result.testCommand).toBe("go test ./...");
      expect(result.coverageCommand).toContain("-coverprofile");
      expect(result.reportPath).toContain("cover.out");
    });
  });

  describe("Rust projects", () => {
    it("detects cargo test from Cargo.toml", async () => {
      const rustPath = resolve(__dirname, "../../fixtures/rust-project");
      const result = await detectTestFramework(rustPath);
      expect(result.framework).toBe("cargo");
      expect(result.confidence).toBe("medium");
      expect(result.testCommand).toBe("cargo test");
      expect(result.coverageCommand).toContain("llvm-cov");
      expect(result.reportPath).toContain("llvm-cov.json");
    });
  });

  describe("unknown projects", () => {
    it("returns unknown for directory without recognized config files", async () => {
      const result = await detectTestFramework(FIXTURE_PATH);
      expect(result.framework).toBe("unknown");
    });

    it("returns unknown for nonexistent path", async () => {
      const result = await detectTestFramework("/nonexistent/path");
      expect(result.framework).toBe("unknown");
      expect(result.confidence).toBe("low");
      expect(result.testCommand).toBe("");
      expect(result.coverageCommand).toBe("");
      expect(result.reportPath).toBe("");
    });
  });
});
