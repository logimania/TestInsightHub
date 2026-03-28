import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock dagre
vi.mock("dagre", () => {
  const mockNode = { x: 100, y: 100 };
  return {
    default: {
      graphlib: {
        Graph: vi.fn().mockImplementation(() => ({
          setDefaultEdgeLabel: vi.fn(),
          setGraph: vi.fn(),
          setNode: vi.fn(),
          setEdge: vi.fn(),
          node: () => mockNode,
        })),
      },
      layout: vi.fn(),
    },
  };
});

// Mock @xyflow/react types minimally
vi.mock("@xyflow/react", () => ({
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
}));

import { useDiagram } from "../../../../src/renderer/hooks/use-diagram";
import type { ProjectStructure, ModuleNode } from "@shared/types/project";
import type { ModuleCoverage } from "@shared/types/coverage";

function makeStructure(modules: ModuleNode[]): ProjectStructure {
  return {
    rootPath: "/project",
    modules,
    edges: [],
    totalFiles: modules.reduce((s, m) => s + m.fileCount, 0),
    totalLoc: modules.reduce((s, m) => s + m.totalLoc, 0),
    parsedAt: "2026-01-01",
    parseErrors: [],
  };
}

function makeModule(id: string, children: ModuleNode[] = []): ModuleNode {
  return {
    id,
    name: id.split("/").pop() ?? id,
    path: id,
    files: [],
    fileCount: 3,
    functionCount: 5,
    totalLoc: 100,
    children,
  };
}

function makeCoverage(moduleId: string, pct: number): ModuleCoverage {
  return {
    moduleId,
    lineCoverage: { covered: pct, total: 100, percentage: pct },
    branchCoverage: null,
    functionCoverage: { covered: pct, total: 100, percentage: pct },
    files: [],
    colorLevel:
      pct >= 80 ? "green" : pct >= 50 ? "yellow" : pct > 0 ? "red" : "grey",
  };
}

describe("useDiagram", () => {
  it("returns empty nodes/edges when structure is null", () => {
    const { result } = renderHook(() => useDiagram(null, [], "hierarchical"));
    expect(result.current.nodes).toEqual([]);
    expect(result.current.edges).toEqual([]);
  });

  it("creates nodes for each module", () => {
    const structure = makeStructure([
      makeModule("src/api"),
      makeModule("src/lib"),
    ]);
    const { result } = renderHook(() =>
      useDiagram(structure, [], "hierarchical"),
    );
    expect(result.current.nodes.length).toBe(2);
    expect(result.current.nodes[0].id).toBe("src/api");
    expect(result.current.nodes[1].id).toBe("src/lib");
  });

  it("attaches coverage data to nodes", () => {
    const structure = makeStructure([makeModule("src/api")]);
    const coverages = [makeCoverage("src/api", 85)];
    const { result } = renderHook(() =>
      useDiagram(structure, coverages, "hierarchical"),
    );
    expect(result.current.nodes[0].data.coverage?.lineCoverage.percentage).toBe(
      85,
    );
  });

  it("creates edges from structure.edges", () => {
    const structure: ProjectStructure = {
      ...makeStructure([makeModule("a"), makeModule("b")]),
      edges: [{ source: "a", target: "b", weight: 2, isCyclic: false }],
    };
    const { result } = renderHook(() =>
      useDiagram(structure, [], "hierarchical"),
    );
    expect(result.current.edges.length).toBe(1);
    expect(result.current.edges[0].source).toBe("a");
    expect(result.current.edges[0].target).toBe("b");
  });

  it("filters edges where source or target node does not exist", () => {
    const structure: ProjectStructure = {
      ...makeStructure([makeModule("a")]),
      edges: [
        { source: "a", target: "nonexistent", weight: 1, isCyclic: false },
      ],
    };
    const { result } = renderHook(() =>
      useDiagram(structure, [], "hierarchical"),
    );
    expect(result.current.edges.length).toBe(0);
  });

  it("uses grid layout when specified", () => {
    const structure = makeStructure([
      makeModule("a"),
      makeModule("b"),
      makeModule("c"),
      makeModule("d"),
    ]);
    const { result } = renderHook(() => useDiagram(structure, [], "grid"));
    // Grid layout positions should be set
    expect(result.current.nodes[0].position.x).toBe(0);
    expect(result.current.nodes[0].position.y).toBe(0);
    // Second node in same row
    expect(result.current.nodes[1].position.x).toBeGreaterThan(0);
  });

  it("toggleExpand adds/removes module from expanded set", () => {
    const structure = makeStructure([
      makeModule("parent", [makeModule("child")]),
    ]);
    const { result } = renderHook(() =>
      useDiagram(structure, [], "hierarchical"),
    );

    expect(result.current.expandedModules.size).toBe(0);

    act(() => {
      result.current.toggleExpand("parent");
    });
    expect(result.current.expandedModules.has("parent")).toBe(true);

    act(() => {
      result.current.toggleExpand("parent");
    });
    expect(result.current.expandedModules.has("parent")).toBe(false);
  });

  it("shows child nodes when parent is expanded", () => {
    const child = makeModule("parent/child");
    const parent = makeModule("parent", [child]);
    const structure = makeStructure([parent]);

    const { result } = renderHook(() =>
      useDiagram(structure, [], "hierarchical"),
    );
    expect(result.current.nodes.length).toBe(1); // only parent

    act(() => {
      result.current.toggleExpand("parent");
    });
    expect(result.current.nodes.length).toBe(2); // parent + child
    // Should also have a child edge
    expect(result.current.edges.length).toBeGreaterThanOrEqual(1);
  });

  it("respects nodeSize parameter", () => {
    const structure = makeStructure([makeModule("a"), makeModule("b")]);
    const { result: small } = renderHook(() =>
      useDiagram(structure, [], "grid", "small"),
    );
    const { result: large } = renderHook(() =>
      useDiagram(structure, [], "grid", "large"),
    );
    // Large nodes should be spaced further apart
    if (small.current.nodes.length > 1 && large.current.nodes.length > 1) {
      expect(large.current.nodes[1].position.x).toBeGreaterThan(
        small.current.nodes[1].position.x,
      );
    }
  });
});
