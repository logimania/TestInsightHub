import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "../stores/project-store";
import { useSettingsStore } from "../stores/settings-store";
import { useUiStore } from "../stores/ui-store";
import { useEffect } from "react";

export function HomePage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loadProject = useProjectStore((s) => s.loadProject);
  const isLoading = useProjectStore((s) => s.isLoading);
  const parseProgress = useProjectStore((s) => s.parseProgress);
  const recentProjects = useSettingsStore((s) => s.recentProjects);
  const loadRecentProjects = useSettingsStore((s) => s.loadRecentProjects);
  const addLog = useUiStore((s) => s.addLog);

  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  const handleSelectProject = async (): Promise<void> => {
    const dirPath = await window.api.project.selectDirectory();
    if (!dirPath) return;

    try {
      await loadProject(dirPath);
      addLog("info", `${t("home.projectLoaded")}: ${dirPath}`);
      navigate("/diagram");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog("error", message);
    }
  };

  const handleOpenRecent = async (rootPath: string): Promise<void> => {
    try {
      await loadProject(rootPath);
      addLog("info", `${t("home.projectLoaded")}: ${rootPath}`);
      navigate("/diagram");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog("error", message);
    }
  };

  return (
    <div className="page home-page">
      <h2 className="page-title">{t("home.title")}</h2>

      <div className="home-actions">
        <button
          className="btn btn-primary btn-large"
          onClick={handleSelectProject}
          disabled={isLoading}
        >
          {isLoading ? t("home.loading") : t("home.selectProject")}
        </button>

        {isLoading && parseProgress && (
          <div className="progress-info">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(parseProgress.current / parseProgress.total) * 100}%`,
                }}
              />
            </div>
            <span className="progress-text">
              {parseProgress.current} / {parseProgress.total}
            </span>
          </div>
        )}
      </div>

      {recentProjects.length > 0 && (
        <div className="home-recent">
          <h3>{t("home.recentProjects")}</h3>
          <ul className="recent-list">
            {recentProjects.map((project) => (
              <li key={project.projectId} className="recent-item">
                <button
                  className="recent-btn"
                  onClick={() => handleOpenRecent(project.rootPath)}
                  disabled={isLoading}
                >
                  <span className="recent-name">{project.projectName}</span>
                  <span className="recent-path">{project.rootPath}</span>
                  <span className="recent-date">
                    {new Date(project.lastOpenedAt).toLocaleDateString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
