import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useProjectStore } from "../stores/project-store";
import { useCoverageStore } from "../stores/coverage-store";
import { useDiagram } from "../hooks/use-diagram";
import { ModuleNodeRenderer } from "../components/diagram/module-node";
import { DependencyEdge } from "../components/diagram/dependency-edge";
import {
  DiagramControls,
  type LayoutMode,
  type NodeSize,
} from "../components/diagram/diagram-controls";
import { useUiStore } from "../stores/ui-store";
import { DiagramDetailPanel } from "../components/diagram/diagram-detail-panel";
import { toSvg, toPng } from "../utils/diagram-export";
import type { ModuleCoverage } from "@shared/types/coverage";

const nodeTypes = { moduleNode: ModuleNodeRenderer };
const edgeTypes = { dependencyEdge: DependencyEdge };

function DiagramContent(): JSX.Element {
  const { t } = useTranslation();
  const structure = useProjectStore((s) => s.structure);
  const moduleCoverages = useCoverageStore((s) => s.moduleCoverages);
  const addLog = useUiStore((s) => s.addLog);
  const [layout, setLayout] = useState<LayoutMode>("hierarchical");
  const [nodeSize, setNodeSize] = useState<NodeSize>("medium");
  const [selectedModule, setSelectedModule] = useState<ModuleCoverage | null>(
    null,
  );
  const { fitView } = useReactFlow();
  const { nodes, edges } = useDiagram(
    structure,
    moduleCoverages,
    layout,
    nodeSize,
  );

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  const handleExport = useCallback(
    async (format: "png" | "svg") => {
      const flowElement = document.querySelector(
        ".react-flow",
      ) as HTMLElement | null;
      if (!flowElement) {
        addLog("error", "ブロック図の要素が見つかりません");
        return;
      }
      try {
        if (format === "svg") {
          const svgContent = await toSvg(flowElement);
          await window.api.exportDiagram({ format: "svg", svgContent });
          addLog("info", "SVGファイルをエクスポートしました");
        } else {
          const pngDataUrl = await toPng(flowElement);
          await window.api.exportDiagram({
            format: "png",
            svgContent: pngDataUrl,
          });
          addLog("info", "PNGファイルをエクスポートしました");
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        addLog("error", `エクスポートに失敗しました: ${msg}`);
      }
    },
    [addLog],
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      const mc = moduleCoverages.find((m) => m.moduleId === node.id);
      const mod = structure?.modules.find((m) => m.id === node.id);
      if (mc) {
        setSelectedModule(mc);
      } else if (mod) {
        setSelectedModule({
          moduleId: mod.id,
          lineCoverage: { covered: 0, total: 0, percentage: 0 },
          branchCoverage: null,
          functionCoverage: { covered: 0, total: 0, percentage: 0 },
          files: [],
          colorLevel: "grey",
        });
      }
    },
    [moduleCoverages, structure],
  );

  if (!structure) {
    return (
      <div className="page diagram-page">
        <div className="page-empty">
          <p>{t("diagram.noProject")}</p>
        </div>
      </div>
    );
  }

  const hasCoverage = moduleCoverages.length > 0;
  const overallCoverage = hasCoverage ? computeOverall(moduleCoverages) : null;

  return (
    <div className="page diagram-page">
      <div className="diagram-toolbar">
        <h2 className="page-title">{t("diagram.title")}</h2>
        <div className="diagram-stats">
          <span>
            {t("diagram.modules")}: {structure.modules.length}
          </span>
          <span>
            {t("diagram.files")}: {structure.totalFiles}
          </span>
          <span>
            {t("diagram.loc")}: {structure.totalLoc.toLocaleString()}
          </span>
          {overallCoverage !== null && (
            <span
              className="diagram-overall-coverage"
              style={{ color: getCoverageColor(overallCoverage) }}
            >
              カバレッジ: {overallCoverage.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <DiagramControls
        layout={layout}
        nodeSize={nodeSize}
        onLayoutChange={setLayout}
        onNodeSizeChange={setNodeSize}
        onFitView={handleFitView}
        onExport={handleExport}
      />

      {!hasCoverage && (
        <div className="diagram-hint">
          カバレッジ画面でテストを実行すると、ブロック図にカバレッジ情報が反映されます。
        </div>
      )}

      <div className="diagram-body">
        <div
          className={`diagram-canvas ${selectedModule ? "diagram-canvas--with-panel" : ""} node-size-${nodeSize}`}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={handleNodeClick}
            fitView
            fitViewOptions={{ padding: 0.3, minZoom: 0.8, maxZoom: 1.2 }}
            minZoom={0.2}
            maxZoom={3}
            defaultEdgeOptions={{ type: "dependencyEdge" }}
          >
            <Background />
            <Controls showFitView showZoom showInteractive={false} />
            <MiniMap nodeStrokeWidth={3} pannable zoomable />
          </ReactFlow>
        </div>

        {selectedModule && (
          <DiagramDetailPanel
            moduleCoverage={selectedModule}
            moduleName={
              structure.modules.find((m) => m.id === selectedModule.moduleId)
                ?.name ?? selectedModule.moduleId
            }
            onClose={() => setSelectedModule(null)}
          />
        )}
      </div>
    </div>
  );
}

function computeOverall(coverages: readonly ModuleCoverage[]): number {
  let covered = 0;
  let total = 0;
  for (const mc of coverages) {
    covered += mc.lineCoverage.covered;
    total += mc.lineCoverage.total;
  }
  return total > 0 ? (covered / total) * 100 : 0;
}

function getCoverageColor(percentage: number): string {
  if (percentage >= 80) return "#16a34a";
  if (percentage >= 50) return "#ca8a04";
  return "#dc2626";
}

export function DiagramPage(): JSX.Element {
  return (
    <ReactFlowProvider>
      <DiagramContent />
    </ReactFlowProvider>
  );
}
