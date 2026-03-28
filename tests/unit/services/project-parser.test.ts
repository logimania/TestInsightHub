import { describe, it, expect } from "vitest";
import { resolve } from "path";
import { parseProject } from "../../../src/main/services/project-parser";

const FIXTURE_PATH = resolve(__dirname, "../../fixtures/sample-project");

describe("parseProject (integration)", () => {
  it("parses the sample project end-to-end", async () => {
    const result = await parseProject({ rootPath: FIXTURE_PATH });

    expect(result.rootPath).toBe(FIXTURE_PATH);
    expect(result.totalFiles).toBe(4);
    expect(result.modules.length).toBeGreaterThan(0);
    expect(result.edges.length).toBeGreaterThan(0);
    expect(result.totalLoc).toBeGreaterThan(0);
    expect(result.parsedAt).toBeTruthy();
    expect(result.parseErrors).toEqual([]);
  });

  it("creates modules for api, service, repo", async () => {
    const result = await parseProject({ rootPath: FIXTURE_PATH });
    const moduleIds = result.modules.map((m) => m.id);

    expect(moduleIds).toContain("src/api");
    expect(moduleIds).toContain("src/service");
    expect(moduleIds).toContain("src/repo");
  });

  it("detects dependencies between modules", async () => {
    const result = await parseProject({ rootPath: FIXTURE_PATH });

    const apiToService = result.edges.find(
      (e) => e.source === "src/api" && e.target === "src/service",
    );
    const serviceToRepo = result.edges.find(
      (e) => e.source === "src/service" && e.target === "src/repo",
    );

    expect(apiToService).toBeDefined();
    expect(serviceToRepo).toBeDefined();
  });

  it("calls onProgress callback", async () => {
    const progressCalls: { current: number; total: number }[] = [];

    await parseProject({
      rootPath: FIXTURE_PATH,
      onProgress: (current, total) => {
        progressCalls.push({ current, total });
      },
    });

    expect(progressCalls.length).toBeGreaterThan(0);
  });
});
