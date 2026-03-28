import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCoverageStore } from "../stores/coverage-store";
import { useProjectStore } from "../stores/project-store";
import { useUiStore } from "../stores/ui-store";
import { useProgress } from "../components/progress-bar-global";
import { useToast } from "../components/toast";
import type {
  CoverageMode,
  TestType,
  FileCoverage,
  NormalizedCoverage,
  CoverageMetric,
} from "@shared/types/coverage";
import type { ProjectStructure } from "@shared/types/project";

function getMetricForMode(
  file: FileCoverage,
  mode: CoverageMode,
): CoverageMetric {
  switch (mode) {
    case "branch":
      return file.branchCoverage ?? file.lineCoverage;
    case "function":
      return file.functionCoverage;
    case "line":
    default:
      return file.lineCoverage;
  }
}

function filterByTestType(
  files: readonly FileCoverage[],
  filter: TestType | "all",
): readonly FileCoverage[] {
  if (filter === "all") return files;
  return files.filter((file) => {
    if (file.coveredByTests.length === 0) return true; // show files with no test info
    return file.coveredByTests.some((t) => t.testType === filter);
  });
}

export function CoveragePage(): JSX.Element {
  const { t } = useTranslation();
  const progress = useProgress();
  const showToast = useToast((s) => s.show);
  const structure = useProjectStore((s) => s.structure);
  const normalizedCoverage = useCoverageStore((s) => s.normalizedCoverage);
  const coverageMode = useCoverageStore((s) => s.coverageMode);
  const testTypeFilter = useCoverageStore((s) => s.testTypeFilter);
  const setCoverageMode = useCoverageStore((s) => s.setCoverageMode);
  const setTestTypeFilter = useCoverageStore((s) => s.setTestTypeFilter);
  const addLog = useUiStore((s) => s.addLog);

  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [customCommand, setCustomCommand] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [noTestsDetected, setNoTestsDetected] = useState(false);

  const coverageModes: CoverageMode[] = ["line", "branch", "function"];
  const testTypes: (TestType | "all")[] = ["all", "unit", "integration", "e2e"];

  // Apply filters
  const filteredFiles = useMemo(() => {
    if (!normalizedCoverage) return [];
    return filterByTestType(normalizedCoverage.files, testTypeFilter);
  }, [normalizedCoverage, testTypeFilter]);

  // Calculate summary stats based on filtered files and selected mode
  const summaryStats = useMemo(() => {
    if (filteredFiles.length === 0) return null;
    let totalCovered = 0;
    let totalTotal = 0;
    for (const file of filteredFiles) {
      const metric = getMetricForMode(file, coverageMode);
      totalCovered += metric.covered;
      totalTotal += metric.total;
    }
    const percentage = totalTotal > 0 ? (totalCovered / totalTotal) * 100 : 0;
    return { totalCovered, totalTotal, percentage };
  }, [filteredFiles, coverageMode]);

  const handleRunTests = async (): Promise<void> => {
    if (!structure) {
      addLog("warning", t("coverage.noProject"));
      return;
    }

    setIsRunning(true);
    progress.start("テストを実行中...");

    // Clean up any previous listener before registering new one
    window.api.removeAllListeners("test:run-output");
    window.api.onTestOutput((line, stream) => {
      addLog(stream === "stderr" ? "warning" : "info", line);
      progress.update(line.length > 60 ? line.slice(0, 60) + "..." : line);
    });

    try {
      const result = await window.api.test.run({
        rootPath: structure.rootPath,
        customCommand: customCommand || undefined,
        timeoutMs: 60000, // 60 seconds
      });

      if (result && result.files.length > 0) {
        useCoverageStore.setState({
          normalizedCoverage: result,
          isLoading: false,
        });
        if (structure) {
          useCoverageStore.getState().computeModuleCoverages(structure.modules);
        }
        showToast(`カバレッジ取得完了: ${result.files.length} ファイル`);
      } else {
        // テストがない or カバレッジレポートが生成されなかった
        // → 全ファイルカバレッジ0%として扱う
        const zeroCoverage = buildZeroCoverage(structure);
        useCoverageStore.setState({
          normalizedCoverage: zeroCoverage,
          isLoading: false,
        });
        if (structure) {
          useCoverageStore.getState().computeModuleCoverages(structure.modules);
        }
        setNoTestsDetected(true);
        addLog("warning", t("coverage.noTestsFound"));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog("error", message);
    } finally {
      setIsRunning(false);
      progress.finish();
      window.api.removeAllListeners("test:run-output");
    }
  };

  const handleLoadExisting = async (): Promise<void> => {
    try {
      const result = await window.api.coverage.load({
        autoDetect: false,
      });
      useCoverageStore.setState({
        normalizedCoverage: result,
        isLoading: false,
      });
      addLog(
        "info",
        `${t("coverage.loaded")}: ${result.files.length} ${t("coverage.filesAnalyzed")}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addLog("error", message);
    }
  };

  return (
    <div className="page coverage-page">
      <div className="coverage-toolbar">
        <h2 className="page-title">{t("coverage.title")}</h2>
        {normalizedCoverage && (
          <div className="coverage-filters">
            <div className="filter-group">
              <label>{t("coverage.mode")}:</label>
              <select
                value={coverageMode}
                onChange={(e) =>
                  setCoverageMode(e.target.value as CoverageMode)
                }
              >
                {coverageModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {t(`coverage.modes.${mode}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>{t("coverage.testType")}:</label>
              <select
                value={testTypeFilter}
                onChange={(e) =>
                  setTestTypeFilter(e.target.value as TestType | "all")
                }
              >
                {testTypes.map((type) => (
                  <option key={type} value={type}>
                    {t(`coverage.testTypes.${type}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {noTestsDetected && normalizedCoverage && (
        <div className="coverage-no-tests-banner">
          <div className="coverage-no-tests-icon">⚠</div>
          <div className="coverage-no-tests-content">
            <h3>{t("coverage.noTestsFoundTitle")}</h3>
            <p>{t("coverage.noTestsFoundDesc")}</p>
            <div className="coverage-no-tests-modules">
              {structure?.modules.map((mod) => (
                <span key={mod.id} className="coverage-no-tests-module">
                  {mod.name}/ ({mod.fileCount} {t("coverage.filesLabel")},{" "}
                  {mod.functionCount} {t("coverage.functionsLabel")})
                </span>
              ))}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/feedback")}
            >
              {t("coverage.generateFeedbackForAll")}
            </button>
          </div>
        </div>
      )}

      {!normalizedCoverage ? (
        <div className="coverage-empty">
          <div className="coverage-empty-icon">📊</div>
          <h3>{t("coverage.getStarted")}</h3>
          <p className="coverage-empty-desc">{t("coverage.getStartedDesc")}</p>

          <div className="coverage-actions">
            <button
              className="btn btn-primary btn-large"
              onClick={handleRunTests}
              disabled={isRunning || !structure}
            >
              {isRunning ? t("coverage.running") : t("coverage.runTests")}
            </button>
          </div>

          {!structure && (
            <p className="coverage-hint">{t("coverage.loadProjectFirst")}</p>
          )}

          <div className="coverage-custom">
            <button
              className="btn btn-link"
              onClick={() => setShowCustomInput(!showCustomInput)}
            >
              {showCustomInput ? "▼" : "▶"} {t("coverage.advancedOptions")}
            </button>
            {showCustomInput && (
              <div className="coverage-custom-input">
                <div className="coverage-advanced-row">
                  <label>{t("coverage.customCommand")}</label>
                  <input
                    type="text"
                    placeholder={t("coverage.customCommandPlaceholder")}
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                  />
                  <p className="coverage-hint">
                    {t("coverage.customCommandHint")}
                  </p>
                </div>
                <div className="coverage-advanced-row">
                  <button
                    className="btn btn-secondary"
                    onClick={handleLoadExisting}
                    disabled={isRunning}
                  >
                    {t("coverage.loadExisting")}
                  </button>
                  <p className="coverage-hint">
                    {t("coverage.loadExistingHint")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="coverage-content">
          <div className="coverage-summary-bar">
            <div className="coverage-summary-item">
              <span className="coverage-summary-label">
                {t("coverage.format")}
              </span>
              <span className="coverage-summary-value">
                {normalizedCoverage.reportFormat}
              </span>
            </div>
            <div className="coverage-summary-item">
              <span className="coverage-summary-label">
                {t("coverage.filesCount")}
              </span>
              <span className="coverage-summary-value">
                {filteredFiles.length}
                {filteredFiles.length !== normalizedCoverage.files.length && (
                  <span className="coverage-filtered-note">
                    {" "}
                    / {normalizedCoverage.files.length}
                  </span>
                )}
              </span>
            </div>
            {summaryStats && (
              <div className="coverage-summary-item">
                <span className="coverage-summary-label">
                  {t(`coverage.modes.${coverageMode}`)}
                </span>
                <span
                  className="coverage-summary-value"
                  style={{ color: getBarColor(summaryStats.percentage) }}
                >
                  {summaryStats.percentage.toFixed(1)}%
                </span>
              </div>
            )}
            <button
              className="btn btn-secondary"
              onClick={handleRunTests}
              disabled={isRunning}
            >
              {isRunning ? t("coverage.running") : t("coverage.rerun")}
            </button>
          </div>

          <div className="coverage-file-list">
            {filteredFiles.map((file) => {
              const metric = getMetricForMode(file, coverageMode);
              return (
                <div key={file.filePath} className="coverage-file-item">
                  <span className="coverage-file-name">{file.filePath}</span>
                  <div className="coverage-file-bar">
                    <div
                      className="coverage-file-bar-fill"
                      style={{
                        width: `${metric.percentage}%`,
                        background: getBarColor(metric.percentage),
                      }}
                    />
                  </div>
                  <span
                    className="coverage-file-percent"
                    style={{ color: getBarColor(metric.percentage) }}
                  >
                    {metric.percentage.toFixed(1)}%
                  </span>
                </div>
              );
            })}
            {filteredFiles.length === 0 && (
              <p
                className="coverage-hint"
                style={{ textAlign: "center", padding: "20px" }}
              >
                {t("coverage.noMatchingFiles")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getBarColor(percentage: number): string {
  if (percentage >= 80) return "#16a34a";
  if (percentage >= 50) return "#ca8a04";
  return "#dc2626";
}

function buildZeroCoverage(
  structure: ProjectStructure | null,
): NormalizedCoverage {
  if (!structure) {
    return {
      reportFormat: "istanbul",
      files: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const zeroMetric: CoverageMetric = { covered: 0, total: 1, percentage: 0 };
  const files: FileCoverage[] = structure.modules.flatMap((mod) =>
    mod.files.map((f) => ({
      filePath: f.path,
      lineCoverage: { covered: 0, total: f.loc, percentage: 0 },
      branchCoverage: null,
      functionCoverage: {
        covered: 0,
        total: f.functions.length || 1,
        percentage: 0,
      },
      uncoveredLines: [{ start: 1, end: f.loc }],
      uncoveredFunctions: f.functions.map((fn) => fn.name),
      coveredByTests: [],
    })),
  );

  return {
    reportFormat: "istanbul",
    files,
    generatedAt: new Date().toISOString(),
  };
}
