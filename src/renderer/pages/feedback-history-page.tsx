import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useFeedbackStore } from "../stores/feedback-store";
import type { FeedbackFile } from "@shared/types/feedback";

export function FeedbackHistoryPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const history = useFeedbackStore((s) => s.history);
  const comparison = useFeedbackStore((s) => s.comparison);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number): void => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="page feedback-history-page">
      <div className="page-header">
        <button className="btn btn-link" onClick={() => navigate("/feedback")}>
          ← {t("feedback.backToFeedback")}
        </button>
        <h2 className="page-title">{t("feedbackHistory.title")}</h2>
      </div>

      {comparison && (
        <div className="comparison-summary">
          <h3>{t("feedbackHistory.comparison")}</h3>
          <div className="comparison-metrics">
            <div className="comp-metric">
              <span className="comp-metric-label">
                {t("feedbackHistory.improvementRate")}
              </span>
              <span className="comp-metric-value improvement-rate">
                {comparison.improvementRate.toFixed(1)}%
              </span>
            </div>
            <div className="comp-metric">
              <span className="comp-metric-label">
                {t("feedbackHistory.improved")}
              </span>
              <span className="comp-metric-value comp-improved">
                {comparison.improved.length}
              </span>
            </div>
            <div className="comp-metric">
              <span className="comp-metric-label">
                {t("feedbackHistory.unchanged")}
              </span>
              <span className="comp-metric-value comp-unchanged">
                {comparison.unchanged.length}
              </span>
            </div>
            <div className="comp-metric">
              <span className="comp-metric-label">新規ギャップ</span>
              <span className="comp-metric-value comp-new">
                {comparison.newGaps.length}
              </span>
            </div>
          </div>

          {comparison.improved.length > 0 && (
            <div className="comp-detail">
              <h4>改善されたファイル</h4>
              <ul className="comp-file-list">
                {comparison.improved.map((item) => (
                  <li
                    key={item.filePath}
                    className="comp-file comp-file--improved"
                  >
                    <span className="comp-file-name">{item.filePath}</span>
                    <span className="comp-file-change">
                      {item.previousCoverage.toFixed(0)}% →{" "}
                      {item.currentCoverage.toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {history.length === 0 ? (
        <div className="page-empty">
          <p>{t("feedbackHistory.empty")}</p>
        </div>
      ) : (
        <div className="history-entries">
          {history
            .slice()
            .reverse()
            .map((fb, revIndex) => {
              const index = history.length - 1 - revIndex;
              const isExpanded = expandedIndex === index;
              return (
                <HistoryEntry
                  key={fb.generatedAt}
                  feedback={fb}
                  number={history.length - revIndex}
                  isExpanded={isExpanded}
                  onToggle={() => toggleExpand(index)}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}

function HistoryEntry({
  feedback,
  number,
  isExpanded,
  onToggle,
}: {
  feedback: FeedbackFile;
  number: number;
  isExpanded: boolean;
  onToggle: () => void;
}): JSX.Element {
  const fb = feedback;
  const moduleNames = [...new Set(fb.gaps.map((g) => g.moduleName))];

  return (
    <div
      className={`history-entry ${isExpanded ? "history-entry--expanded" : ""}`}
    >
      <button className="history-entry-header" onClick={onToggle}>
        <span className="history-num">#{number}</span>
        <span className="history-date">
          {new Date(fb.generatedAt).toLocaleString()}
        </span>
        <span
          className="history-coverage-badge"
          style={{ color: coverageColor(fb.summary.overallCoverage) }}
        >
          {fb.summary.overallCoverage.toFixed(1)}%
        </span>
        <span className="history-threshold">閾値: {fb.coverageThreshold}%</span>
        <span className="history-gap-count">
          {fb.gaps.length} ギャップ / {fb.summary.totalModules} モジュール
        </span>
        <span className="history-expand-icon">{isExpanded ? "▼" : "▶"}</span>
      </button>

      {isExpanded && (
        <div className="history-entry-detail">
          <div className="history-detail-summary">
            <div className="hd-item">
              <span className="hd-label">全体カバレッジ</span>
              <span
                className="hd-value"
                style={{ color: coverageColor(fb.summary.overallCoverage) }}
              >
                {fb.summary.overallCoverage.toFixed(1)}%
              </span>
            </div>
            <div className="hd-item">
              <span className="hd-label">閾値未満モジュール</span>
              <span className="hd-value">{fb.summary.belowThreshold}</span>
            </div>
            <div className="hd-item">
              <span className="hd-label">未テスト関数</span>
              <span className="hd-value">
                {fb.summary.totalUncoveredFunctions}
              </span>
            </div>
          </div>

          {moduleNames.length > 0 && (
            <div className="history-detail-modules">
              <h4>対象モジュール</h4>
              <div className="hd-module-tags">
                {moduleNames.map((name) => (
                  <span key={name} className="hd-module-tag">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="history-detail-gaps">
            <h4>ギャップ一覧 ({fb.gaps.length})</h4>
            <ul className="hd-gap-list">
              {fb.gaps.map((gap) => (
                <li
                  key={gap.filePath}
                  className={`hd-gap hd-gap--${gap.priority}`}
                >
                  <span className="hd-gap-file">{gap.filePath}</span>
                  <span className="hd-gap-coverage">
                    {gap.currentCoverage}% → {gap.targetCoverage}%
                  </span>
                  <span
                    className={`hd-gap-priority hd-gap-priority--${gap.priority}`}
                  >
                    {gap.priority.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function coverageColor(pct: number): string {
  if (pct >= 80) return "#16a34a";
  if (pct >= 50) return "#ca8a04";
  return "#dc2626";
}
