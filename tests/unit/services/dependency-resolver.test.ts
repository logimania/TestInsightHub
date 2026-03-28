import { describe, it, expect } from "vitest";
import {
  resolveDependencies,
  getModuleName,
  detectCycles,
} from "../../../src/main/services/project-parser/dependency-resolver";
import type { ParsedFile } from "@shared/types/project";

describe("dependency-resolver", () => {
  const makeFile = (path: string, imports: string[]): ParsedFile => ({
    path,
    language: "typescript",
    loc: 10,
    functions: [],
    imports,
  });

  it("resolves cross-module dependencies", () => {
    const files: ParsedFile[] = [
      makeFile("src/api/handler.ts", ["../service/user-service"]),
      makeFile("src/service/user-service.ts", ["../repo/user-repo"]),
      makeFile("src/repo/user-repo.ts", []),
    ];

    const edges = resolveDependencies(files);

    expect(edges.length).toBeGreaterThanOrEqual(2);
    expect(
      edges.some((e) => e.source === "src/api" && e.target === "src/service"),
    ).toBe(true);
    expect(
      edges.some((e) => e.source === "src/service" && e.target === "src/repo"),
    ).toBe(true);
  });

  it("ignores intra-module imports", () => {
    const files: ParsedFile[] = [
      makeFile("src/repo/user-repo.ts", ["./order-repo"]),
      makeFile("src/repo/order-repo.ts", []),
    ];

    const edges = resolveDependencies(files);
    expect(edges.length).toBe(0);
  });

  it("detects cyclic dependencies", () => {
    const files: ParsedFile[] = [
      makeFile("src/a/index.ts", ["../b/index"]),
      makeFile("src/b/index.ts", ["../a/index"]),
    ];

    const edges = resolveDependencies(files);
    const cyclicEdges = edges.filter((e) => e.isCyclic);
    expect(cyclicEdges.length).toBe(2);
  });

  it("calculates edge weight from import count", () => {
    const files: ParsedFile[] = [
      makeFile("src/api/a.ts", ["../service/x"]),
      makeFile("src/api/b.ts", ["../service/y"]),
      makeFile("src/service/x.ts", []),
      makeFile("src/service/y.ts", []),
    ];

    const edges = resolveDependencies(files);
    const apiToService = edges.find(
      (e) => e.source === "src/api" && e.target === "src/service",
    );
    expect(apiToService).toBeDefined();
    expect(apiToService!.weight).toBe(2);
  });
});

describe("getModuleName", () => {
  it("extracts module from 2-level path", () => {
    expect(getModuleName("src/api/handler.ts")).toBe("src/api");
  });

  it("handles single-level path", () => {
    expect(getModuleName("lib/utils.ts")).toBe("lib");
  });

  it("handles root-level file", () => {
    expect(getModuleName("index.ts")).toBe(".");
  });
});

describe("detectCycles", () => {
  it("finds cycles in a graph", () => {
    const edges = [
      { source: "A", target: "B", weight: 1, isCyclic: false },
      { source: "B", target: "C", weight: 1, isCyclic: false },
      { source: "C", target: "A", weight: 1, isCyclic: false },
    ];
    const cycles = detectCycles(edges);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it("returns empty for acyclic graph", () => {
    const edges = [
      { source: "A", target: "B", weight: 1, isCyclic: false },
      { source: "B", target: "C", weight: 1, isCyclic: false },
    ];
    const cycles = detectCycles(edges);
    expect(cycles.length).toBe(0);
  });
});
