export type LayoutMode = "hierarchical" | "force";
export type NodeSize = "small" | "medium" | "large";

interface DiagramControlsProps {
  readonly layout: LayoutMode;
  readonly nodeSize: NodeSize;
  readonly onLayoutChange: (layout: LayoutMode) => void;
  readonly onNodeSizeChange: (size: NodeSize) => void;
  readonly onFitView: () => void;
  readonly onExport: (format: "png" | "svg") => void;
}

const SIZE_LABELS: Record<NodeSize, string> = {
  small: "小",
  medium: "中",
  large: "大",
};

export function DiagramControls({
  layout,
  nodeSize,
  onLayoutChange,
  onNodeSizeChange,
  onFitView,
  onExport,
}: DiagramControlsProps): JSX.Element {
  return (
    <div className="diagram-controls">
      <div className="diagram-controls-left">
        <div className="control-group">
          <button
            className={`control-btn ${layout === "hierarchical" ? "control-btn--active" : ""}`}
            onClick={() => onLayoutChange("hierarchical")}
          >
            階層
          </button>
          <button
            className={`control-btn ${layout === "force" ? "control-btn--active" : ""}`}
            onClick={() => onLayoutChange("force")}
          >
            力指向
          </button>
        </div>

        <div className="control-group">
          <span className="control-label">文字サイズ:</span>
          {(["small", "medium", "large"] as const).map((size) => (
            <button
              key={size}
              className={`control-btn ${nodeSize === size ? "control-btn--active" : ""}`}
              onClick={() => onNodeSizeChange(size)}
            >
              {SIZE_LABELS[size]}
            </button>
          ))}
        </div>

        <div className="control-group">
          <button className="control-btn" onClick={onFitView}>
            全体表示
          </button>
        </div>
      </div>

      <div className="diagram-controls-right">
        <div className="control-group">
          <button className="control-btn" onClick={() => onExport("png")}>
            PNG
          </button>
          <button className="control-btn" onClick={() => onExport("svg")}>
            SVG
          </button>
        </div>
      </div>
    </div>
  );
}
