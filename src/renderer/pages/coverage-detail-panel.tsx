import { useTranslation } from "react-i18next";
import type { ModuleCoverage, FileCoverage } from "@shared/types/coverage";

interface CoverageDetailPanelProps {
  readonly moduleCoverage: ModuleCoverage | null;
  readonly onClose: () => void;
}

export function CoverageDetailPanel({
  moduleCoverage,
  onClose,
}: CoverageDetailPanelProps): JSX.Element {
  const { t } = useTranslation();

  if (!moduleCoverage) return <></>;

  return (
    <div className="detail-panel">
      <div className="detail-panel-header">
        <h3>{moduleCoverage.moduleId}</h3>
        <span
          className={`detail-badge detail-badge--${moduleCoverage.colorLevel}`}
        >
          {moduleCoverage.lineCoverage.percentage.toFixed(1)}%
        </span>
        <button className="btn btn-link" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="detail-panel-metrics">
        <MetricRow label="Line" metric={moduleCoverage.lineCoverage} />
        {moduleCoverage.branchCoverage && (
          <MetricRow label="Branch" metric={moduleCoverage.branchCoverage} />
        )}
        <MetricRow label="Function" metric={moduleCoverage.functionCoverage} />
      </div>

      <div className="detail-panel-files">
        <h4>ファイル別カバレッジ</h4>
        <ul className="detail-file-list">
          {moduleCoverage.files.map((file) => (
            <FileRow key={file.filePath} file={file} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  metric,
}: {
  label: string;
  metric: { covered: number; total: number; percentage: number };
}): JSX.Element {
  return (
    <div className="metric-row">
      <span className="metric-label">{label}</span>
      <div className="metric-bar">
        <div
          className="metric-bar-fill"
          style={{ width: `${metric.percentage}%` }}
        />
      </div>
      <span className="metric-value">
        {metric.covered}/{metric.total} ({metric.percentage.toFixed(1)}%)
      </span>
    </div>
  );
}

function FileRow({ file }: { file: FileCoverage }): JSX.Element {
  const fileName = file.filePath.split("/").pop() ?? file.filePath;

  return (
    <li className="detail-file-item">
      <div className="detail-file-header">
        <span className="detail-file-name">{fileName}</span>
        <span className="detail-file-coverage">
          {file.lineCoverage.percentage.toFixed(0)}%
        </span>
      </div>
      {file.uncoveredFunctions.length > 0 && (
        <div className="detail-file-uncovered">
          未カバー: {file.uncoveredFunctions.join(", ")}
        </div>
      )}
      {file.uncoveredLines.length > 0 && (
        <div className="detail-file-lines">
          {file.uncoveredLines.map((range, i) => (
            <span key={i} className="line-range">
              L{range.start}-{range.end}
              {range.functionName && ` (${range.functionName})`}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}
