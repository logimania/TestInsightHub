import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/ui-store";

export function LogPanel(): JSX.Element {
  const { t } = useTranslation();
  const isOpen = useUiStore((s) => s.isLogPanelOpen);
  const logs = useUiStore((s) => s.logs);
  const clearLogs = useUiStore((s) => s.clearLogs);

  if (!isOpen) {
    return <></>;
  }

  return (
    <div className="log-panel">
      <div className="log-panel-header">
        <span className="log-panel-title">{t("logPanel.title")}</span>
        <button className="log-panel-clear" onClick={clearLogs}>
          {t("logPanel.clear")}
        </button>
      </div>
      <div className="log-panel-content">
        {logs.length === 0 ? (
          <p className="log-panel-empty">{t("logPanel.empty")}</p>
        ) : (
          <ul className="log-list">
            {logs.map((log) => (
              <li key={log.id} className={`log-item log-item--${log.level}`}>
                <span className="log-time">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="log-level">[{log.level.toUpperCase()}]</span>
                <span className="log-message">{log.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
