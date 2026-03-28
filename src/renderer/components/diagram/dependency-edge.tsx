import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";

interface DependencyEdgeData {
  weight: number;
  isCyclic: boolean;
}

export function DependencyEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps): JSX.Element {
  const edgeData = data as DependencyEdgeData | undefined;
  const isCyclic = edgeData?.isCyclic ?? false;
  const weight = edgeData?.weight ?? 1;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isCyclic ? "#dc2626" : "#9ca3af",
          strokeWidth: Math.min(weight + 1, 5),
          strokeDasharray: isCyclic ? "5 3" : undefined,
        }}
      />
      {weight > 1 && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 13,
              fontWeight: 600,
              background: "var(--color-bg)",
              padding: "2px 8px",
              borderRadius: 4,
              color: isCyclic ? "#dc2626" : "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
              pointerEvents: "none",
            }}
          >
            {weight}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
