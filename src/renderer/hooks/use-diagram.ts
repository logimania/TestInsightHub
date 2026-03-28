import { useMemo, useCallback, useState } from "react";
import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";
import type {
  ProjectStructure,
  ModuleNode as ModuleNodeType,
} from "@shared/types/project";
import type { ModuleCoverage } from "@shared/types/coverage";
import type {
  LayoutMode,
  NodeSize,
} from "../components/diagram/diagram-controls";
import type { ModuleNodeProps } from "../components/diagram/module-node";

interface SizeConfig {
  readonly width: number;
  readonly height: number;
  readonly nodesep: number;
  readonly ranksep: number;
  readonly gridGap: number;
}

const SIZE_CONFIGS: Record<NodeSize, SizeConfig> = {
  small: { width: 200, height: 120, nodesep: 50, ranksep: 70, gridGap: 30 },
  medium: { width: 280, height: 160, nodesep: 70, ranksep: 90, gridGap: 40 },
  large: { width: 380, height: 200, nodesep: 100, ranksep: 120, gridGap: 60 },
};

export function useDiagram(
  structure: ProjectStructure | null,
  moduleCoverages: readonly ModuleCoverage[],
  layout: LayoutMode,
  nodeSize: NodeSize = "medium",
) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );

  const toggleExpand = useCallback((moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }, []);

  const coverageMap = useMemo(() => {
    const map = new Map<string, ModuleCoverage>();
    for (const mc of moduleCoverages) {
      map.set(mc.moduleId, mc);
    }
    return map;
  }, [moduleCoverages]);

  const sizeConfig = SIZE_CONFIGS[nodeSize];

  const { nodes, edges } = useMemo(() => {
    if (!structure) return { nodes: [], edges: [] };

    const flowNodes: Node<ModuleNodeProps>[] = [];
    const childEdges: Edge[] = [];
    let childEdgeIdx = 0;

    for (const mod of structure.modules) {
      // Add the parent module node
      flowNodes.push({
        id: mod.id,
        type: "moduleNode",
        position: { x: 0, y: 0 },
        data: {
          module: mod,
          coverage: coverageMap.get(mod.id),
          isExpanded: expandedModules.has(mod.id),
          onExpand: toggleExpand,
        },
      });

      // If expanded, add child module nodes
      if (expandedModules.has(mod.id) && mod.children.length > 0) {
        for (const child of mod.children) {
          flowNodes.push({
            id: child.id,
            type: "moduleNode",
            position: { x: 0, y: 0 },
            data: {
              module: child,
              coverage: coverageMap.get(child.id),
              onExpand: toggleExpand,
            },
          });

          // Edge from parent to child
          childEdges.push({
            id: `child-e-${childEdgeIdx++}`,
            source: mod.id,
            target: child.id,
            type: "dependencyEdge",
            data: { weight: 1, isCyclic: false },
            style: { strokeDasharray: "4 2" },
          });
        }
      }
    }

    const flowEdges: Edge[] = structure.edges
      .map((edge, i) => ({
        id: `e-${i}`,
        source: edge.source,
        target: edge.target,
        type: "dependencyEdge",
        data: { weight: edge.weight, isCyclic: edge.isCyclic },
        animated: edge.isCyclic,
      }))
      // Only include edges where both source and target exist as nodes
      .filter(
        (e) =>
          flowNodes.some((n) => n.id === e.source) &&
          flowNodes.some((n) => n.id === e.target),
      );

    const allEdges = [...flowEdges, ...childEdges];

    if (layout === "hierarchical") {
      applyDagreLayout(flowNodes, allEdges, sizeConfig);
    } else {
      applyGridLayout(flowNodes, sizeConfig);
    }

    return { nodes: flowNodes, edges: allEdges };
  }, [
    structure,
    coverageMap,
    layout,
    toggleExpand,
    sizeConfig,
    expandedModules,
  ]);

  return { nodes, edges, expandedModules, toggleExpand };
}

function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  config: SizeConfig,
): void {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: config.nodesep,
    ranksep: config.ranksep,
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: config.width, height: config.height });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  for (const node of nodes) {
    const graphNode = g.node(node.id);
    if (graphNode) {
      node.position = {
        x: graphNode.x - config.width / 2,
        y: graphNode.y - config.height / 2,
      };
    }
  }
}

function applyGridLayout(nodes: Node[], config: SizeConfig): void {
  const columns = Math.ceil(Math.sqrt(nodes.length));
  for (let i = 0; i < nodes.length; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    nodes[i].position = {
      x: col * (config.width + config.gridGap),
      y: row * (config.height + config.gridGap),
    };
  }
}
