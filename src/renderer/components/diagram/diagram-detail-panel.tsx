import { useNavigate } from "react-router-dom";
import type { ModuleCoverage, FileCoverage } from "@shared/types/coverage";

interface DiagramDetailPanelProps {
  readonly moduleCoverage: ModuleCoverage;
  readonly moduleName: string;
  readonly onClose: () => void;
}

export function DiagramDetailPanel({
  moduleCoverage,
  moduleName,
  onClose,
}: DiagramDetailPanelProps): JSX.Element {
  const navigate = useNavigate();
  const mc = moduleCoverage;

  const handleGenerateFeedback = (): void => {
    navigate(`/feedback?module=${encodeURIComponent(mc.moduleId)}`);
  };

  return (
    <div className="diagram-detail-panel">
      <div className="ddp-header">
        <div className="ddp-title">
          <span className="ddp-module-name">{moduleName}/</span>
          <span className={`ddp-badge ddp-badge--${mc.colorLevel}`}>
            {mc.lineCoverage.percentage.toFixed(1)}%
          </span>
        </div>
        <button className="ddp-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="ddp-metrics">
        <MetricBar label="Line" metric={mc.lineCoverage} />
        {mc.branchCoverage && (
          <MetricBar label="Branch" metric={mc.branchCoverage} />
        )}
        <MetricBar label="Function" metric={mc.functionCoverage} />
      </div>

      {mc.files.length > 0 ? (
        <div className="ddp-files">
          <h4 className="ddp-section-title">ファイル ({mc.files.length})</h4>
          <ul className="ddp-file-list">
            {mc.files
              .sort(
                (a, b) => a.lineCoverage.percentage - b.lineCoverage.percentage,
              )
              .map((file) => (
                <FileRow key={file.filePath} file={file} />
              ))}
          </ul>
        </div>
      ) : (
        <div className="ddp-empty">カバレッジデータがありません</div>
      )}

      {mc.colorLevel !== "green" && mc.colorLevel !== "grey" && (
        <div className="ddp-actions">
          <button className="btn btn-primary" onClick={handleGenerateFeedback}>
            このモジュールのフィードバックを生成
          </button>
        </div>
      )}
    </div>
  );
}

function MetricBar({
  label,
  metric,
}: {
  label: string;
  metric: { covered: number; total: number; percentage: number };
}): JSX.Element {
  return (
    <div className="ddp-metric-row">
      <span className="ddp-metric-label">{label}</span>
      <div className="ddp-metric-bar">
        <div
          className="ddp-metric-bar-fill"
          style={{
            width: `${metric.percentage}%`,
            background: getColor(metric.percentage),
          }}
        />
      </div>
      <span className="ddp-metric-value">
        {metric.covered}/{metric.total} ({metric.percentage.toFixed(1)}%)
      </span>
    </div>
  );
}

function FileRow({ file }: { file: FileCoverage }): JSX.Element {
  const fileName = file.filePath.split("/").pop() ?? file.filePath;
  const pct = file.lineCoverage.percentage;

  return (
    <li className="ddp-file-item">
      <div className="ddp-file-top">
        <span className="ddp-file-name">{fileName}</span>
        <span className="ddp-file-pct" style={{ color: getColor(pct) }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      {file.uncoveredFunctions.length > 0 && (
        <div className="ddp-file-uncovered">
          未テスト: {file.uncoveredFunctions.join(", ")}
        </div>
      )}
      {file.coveredByTests.length > 0 && (
        <div className="ddp-file-tests">
          テスト:{" "}
          {file.coveredByTests
            .map((t) => `${t.testName} (${t.testType})`)
            .join(", ")}
        </div>
      )}
    </li>
  );
}

function getColor(pct: number): string {
  if (pct >= 80) return "#16a34a";
  if (pct >= 50) return "#ca8a04";
  return "#dc2626";
}
