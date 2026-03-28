import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps, Node } from "@xyflow/react";
import type { ModuleNode as ModuleNodeData } from "@shared/types/project";
import type { ModuleCoverage, CoverageMode } from "@shared/types/coverage";
import { useCoverageStore } from "../../stores/coverage-store";

export interface ModuleNodeProps {
  module: ModuleNodeData;
  coverage?: ModuleCoverage;
  isExpanded?: boolean;
  onExpand?: (moduleId: string) => void;
}

type ModuleFlowNode = Node<ModuleNodeProps>;

function ModuleNodeComponent({ data }: NodeProps<ModuleFlowNode>): JSX.Element {
  const { module: mod, coverage, isExpanded, onExpand } = data;
  const coverageMode = useCoverageStore((s) => s.coverageMode);

  const colorLevel = coverage?.colorLevel ?? "none";
  const headerStyle = getHeaderStyle(colorLevel);

  const coveragePercent = coverage
    ? getActivePercentage(coverage, coverageMode)
    : null;

  const barColor = coverage
    ? getCoverageBarColor(coverage.colorLevel)
    : "#9ca3af";

  return (
    <div className={`module-node module-node--${colorLevel}`}>
      <Handle type="target" position={Position.Top} />

      <div className="module-node-header" style={headerStyle}>
        <span className="module-node-name">{mod.name}/</span>
      </div>

      <div className="module-node-body">
        <div className="module-node-stats">
          <span>Files: {mod.fileCount}</span>
          <span>Fn: {mod.functionCount}</span>
          <span>LOC: {mod.totalLoc}</span>
        </div>

        {coveragePercent !== null && (
          <div className="module-node-coverage">
            <div className="coverage-bar">
              <div
                className="coverage-bar-fill"
                style={{
                  width: `${coveragePercent}%`,
                  background: barColor,
                }}
              />
            </div>
            <span className="coverage-percent">
              {coveragePercent.toFixed(0)}%
            </span>
          </div>
        )}

        {mod.children.length > 0 && (
          <button
            className="module-node-expand"
            onClick={(e) => {
              e.stopPropagation();
              onExpand?.(mod.id);
            }}
          >
            {isExpanded ? "▼ 折りたたむ" : `▶ 展開 (${mod.children.length})`}
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function getHeaderStyle(colorLevel: string): React.CSSProperties {
  switch (colorLevel) {
    case "green":
      return { background: "#16a34a", color: "#ffffff" };
    case "yellow":
      return { background: "#ca8a04", color: "#ffffff" };
    case "red":
      return { background: "#dc2626", color: "#ffffff" };
    case "grey":
      return { background: "#6b7280", color: "#ffffff" };
    case "none":
    default:
      // No coverage: use theme-aware colors via CSS variables
      return {
        background: "var(--color-primary)",
        color: "#ffffff",
      };
  }
}

function getCoverageBarColor(level: string): string {
  switch (level) {
    case "green":
      return "#16a34a";
    case "yellow":
      return "#ca8a04";
    case "red":
      return "#dc2626";
    default:
      return "#9ca3af";
  }
}

function getActivePercentage(
  coverage: ModuleCoverage,
  mode: CoverageMode,
): number {
  switch (mode) {
    case "branch":
      return (
        coverage.branchCoverage?.percentage ?? coverage.lineCoverage.percentage
      );
    case "function":
      return coverage.functionCoverage.percentage;
    case "line":
    default:
      return coverage.lineCoverage.percentage;
  }
}

export const ModuleNodeRenderer = memo(ModuleNodeComponent);
