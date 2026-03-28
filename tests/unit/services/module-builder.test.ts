import { describe, it, expect } from "vitest";
import { buildModules } from "../../../src/main/services/project-parser/module-builder";
import type { ParsedFile } from "@shared/types/project";

describe("module-builder", () => {
  const makeFile = (path: string, loc: number = 10): ParsedFile => ({
    path,
    language: "typescript",
    loc,
    functions: [{ name: "fn", startLine: 1, endLine: 5, complexity: 1 }],
    imports: [],
  });

  it("groups files into modules by directory", () => {
    const files: ParsedFile[] = [
      makeFile("src/api/handler.ts"),
      makeFile("src/api/router.ts"),
      makeFile("src/service/user-service.ts"),
    ];

    const modules = buildModules(files);

    expect(modules.length).toBe(2);
    const apiModule = modules.find((m) => m.id === "src/api");
    const serviceModule = modules.find((m) => m.id === "src/service");

    expect(apiModule).toBeDefined();
    expect(apiModule!.fileCount).toBe(2);
    expect(serviceModule).toBeDefined();
    expect(serviceModule!.fileCount).toBe(1);
  });

  it("calculates correct statistics", () => {
    const files: ParsedFile[] = [
      makeFile("src/repo/user-repo.ts", 100),
      makeFile("src/repo/order-repo.ts", 50),
    ];

    const modules = buildModules(files);
    const repo = modules.find((m) => m.id === "src/repo");

    expect(repo).toBeDefined();
    expect(repo!.totalLoc).toBe(150);
    expect(repo!.functionCount).toBe(2);
    expect(repo!.fileCount).toBe(2);
  });

  it("sorts modules alphabetically", () => {
    const files: ParsedFile[] = [
      makeFile("src/z/a.ts"),
      makeFile("src/a/b.ts"),
      makeFile("src/m/c.ts"),
    ];

    const modules = buildModules(files);
    const ids = modules.map((m) => m.id);

    expect(ids).toEqual(["src/a", "src/m", "src/z"]);
  });

  it("handles single-level paths", () => {
    const files: ParsedFile[] = [makeFile("lib/utils.ts")];

    const modules = buildModules(files);
    expect(modules.length).toBe(1);
    expect(modules[0].name).toBe("lib");
    expect(modules[0].id).toBe("lib");
  });
});
