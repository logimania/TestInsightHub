import { dirname, resolve, extname } from "path";
import type { ParsedFile, DependencyEdge } from "@shared/types/project";

/**
 * ParsedFile[] からモジュール間の依存関係を解決する。
 */
export function resolveDependencies(
  files: readonly ParsedFile[],
): readonly DependencyEdge[] {
  const fileByPath = new Map<string, ParsedFile>();
  for (const file of files) {
    fileByPath.set(file.path, file);
    const noExt = stripExtension(file.path);
    fileByPath.set(noExt, file);
  }

  const moduleEdges = new Map<string, Map<string, number>>();

  for (const file of files) {
    const sourceModule = getModuleName(file.path);
    for (const imp of file.imports) {
      const resolvedPath = resolveImportPath(file.path, imp);
      const targetFile =
        fileByPath.get(resolvedPath) ??
        fileByPath.get(stripExtension(resolvedPath));
      if (!targetFile) continue;

      const targetModule = getModuleName(targetFile.path);
      if (sourceModule === targetModule) continue;

      if (!moduleEdges.has(sourceModule)) {
        moduleEdges.set(sourceModule, new Map());
      }
      const targets = moduleEdges.get(sourceModule)!;
      targets.set(targetModule, (targets.get(targetModule) ?? 0) + 1);
    }
  }

  const edges: DependencyEdge[] = [];
  const reverseCheck = new Set<string>();

  for (const [source, targets] of moduleEdges) {
    for (const [target, weight] of targets) {
      const key = `${source}->${target}`;
      const reverseKey = `${target}->${source}`;
      const isCyclic = reverseCheck.has(reverseKey);
      reverseCheck.add(key);

      edges.push({ source, target, weight, isCyclic });
    }
  }

  return markCyclicEdges(edges);
}

function markCyclicEdges(
  edges: readonly DependencyEdge[],
): readonly DependencyEdge[] {
  const edgeSet = new Set(edges.map((e) => `${e.source}->${e.target}`));
  return edges.map((e) => ({
    ...e,
    isCyclic: edgeSet.has(`${e.target}->${e.source}`),
  }));
}

export function getModuleName(filePath: string): string {
  const dir = dirname(filePath);
  const parts = dir.split("/");
  if (parts.length >= 2) {
    return parts.slice(0, 2).join("/");
  }
  return parts[0] || ".";
}

function resolveImportPath(importerPath: string, importPath: string): string {
  if (importPath.startsWith(".")) {
    const dir = dirname(importerPath);
    // Use manual path resolution to keep relative paths
    const parts = dir.split("/").concat(importPath.split("/"));
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === "..") {
        resolved.pop();
      } else if (part !== "." && part !== "") {
        resolved.push(part);
      }
    }
    return resolved.join("/");
  }
  return importPath;
}

function stripExtension(filePath: string): string {
  const ext = extname(filePath);
  if (
    [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".py",
      ".go",
      ".rs",
      ".c",
      ".cpp",
      ".h",
      ".hpp",
    ].includes(ext)
  ) {
    return filePath.slice(0, -ext.length);
  }
  return filePath;
}

/**
 * 循環依存を検出する（Tarjan のアルゴリズム簡易版）。
 */
export function detectCycles(
  edges: readonly DependencyEdge[],
): readonly string[][] {
  const graph = new Map<string, string[]>();
  for (const edge of edges) {
    if (!graph.has(edge.source)) graph.set(edge.source, []);
    graph.get(edge.source)!.push(edge.target);
  }

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      if (cycleStart >= 0) {
        cycles.push(path.slice(cycleStart));
      }
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);
    path.push(node);

    for (const neighbor of graph.get(node) ?? []) {
      dfs(neighbor, [...path]);
    }

    stack.delete(node);
  }

  for (const node of graph.keys()) {
    dfs(node, []);
  }

  return cycles;
}
