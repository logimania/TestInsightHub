import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/ui-store";
import { useProjectStore } from "../../stores/project-store";

export function Header(): JSX.Element {
  const { t } = useTranslation();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const toggleLogPanel = useUiStore((s) => s.toggleLogPanel);
  const structure = useProjectStore((s) => s.structure);

  const handleToggleTheme = (): void => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="header">
      <div className="header-left">
        {structure && (
          <span className="header-project">{structure.rootPath}</span>
        )}
      </div>
      <div className="header-right">
        <button
          className="header-btn"
          onClick={handleToggleTheme}
          title={t("header.toggleTheme")}
        >
          {theme === "light" ? "🌙" : "☀"}
        </button>
        <button
          className="header-btn"
          onClick={toggleLogPanel}
          title={t("header.toggleLog")}
        >
          📋
        </button>
      </div>
    </header>
  );
}
