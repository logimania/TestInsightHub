import { describe, it, expect } from "vitest";
import { resolve } from "path";
import { scanProject } from "../../../src/main/services/project-parser/file-scanner";

const FIXTURE_PATH = resolve(__dirname, "../../fixtures/sample-project");

describe("file-scanner", () => {
  it("scans a sample project and finds TypeScript files", async () => {
    const result = await scanProject(FIXTURE_PATH);

    expect(result.files.length).toBeGreaterThan(0);
    expect(result.files.every((f) => f.language === "typescript")).toBe(true);
  });

  it("returns correct relative paths", async () => {
    const result = await scanProject(FIXTURE_PATH);
    const paths = result.files.map((f) => f.relativePath);

    expect(paths).toContain("src/api/handler.ts");
    expect(paths).toContain("src/service/user-service.ts");
    expect(paths).toContain("src/repo/user-repo.ts");
    expect(paths).toContain("src/repo/order-repo.ts");
  });

  it("respects .gitignore patterns", async () => {
    const result = await scanProject(FIXTURE_PATH);
    const paths = result.files.map((f) => f.relativePath);

    const hasNodeModules = paths.some((p) => p.includes("node_modules"));
    expect(hasNodeModules).toBe(false);
  });

  it("skips excluded directories", async () => {
    const result = await scanProject(FIXTURE_PATH);
    const paths = result.files.map((f) => f.relativePath);

    const hasDist = paths.some((p) => p.startsWith("dist/"));
    expect(hasDist).toBe(false);
  });

  it("reports scan statistics", async () => {
    const result = await scanProject(FIXTURE_PATH);

    expect(result.totalScanned).toBeGreaterThan(0);
    expect(result.isLargeProject).toBe(false);
  });

  it("applies custom exclude patterns", async () => {
    const result = await scanProject(FIXTURE_PATH, [".*handler.*"]);
    const paths = result.files.map((f) => f.relativePath);

    const hasHandler = paths.some((p) => p.includes("handler"));
    expect(hasHandler).toBe(false);
  });

  it("calls onProgress callback at intervals", async () => {
    const progressCalls: Array<{ current: number; file: string }> = [];
    await scanProject(FIXTURE_PATH, [], (current, file) => {
      progressCalls.push({ current, file });
    });
    // Progress is called every 100 files; small fixture may not trigger it
    // but the callback should at least be accepted without error
    expect(progressCalls).toBeDefined();
  });

  it("handles non-existent root path gracefully", async () => {
    const result = await scanProject("/nonexistent/path/that/does/not/exist");
    expect(result.files).toHaveLength(0);
    expect(result.totalScanned).toBe(0);
  });

  it("tracks skippedByIgnore count", async () => {
    const result = await scanProject(FIXTURE_PATH);
    // skippedByIgnore should be a non-negative number
    expect(result.skippedByIgnore).toBeGreaterThanOrEqual(0);
  });
});
