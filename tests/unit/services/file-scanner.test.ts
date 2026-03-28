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
});
