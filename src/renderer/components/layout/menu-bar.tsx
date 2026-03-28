import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "../../stores/ui-store";
import { useProjectStore } from "../../stores/project-store";
import { useCoverageStore } from "../../stores/coverage-store";
import { useFeedbackStore } from "../../stores/feedback-store";
import { AboutDialog } from "../about-dialog";
import { useToast } from "../toast";

interface MenuItem {
  readonly label: string;
  readonly action?: () => void;
  readonly separator?: boolean;
  readonly shortcut?: string;
}

interface MenuGroup {
  readonly label: string;
  readonly items: readonly MenuItem[];
}

export function MenuBar(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const toggleLogPanel = useUiStore((s) => s.toggleLogPanel);
  const showToast = useToast((s) => s.show);

  const handleCloseProject = (): void => {
    useProjectStore.getState().reset();
    useCoverageStore.getState().reset();
    useFeedbackStore.getState().reset();
    navigate("/");
    showToast("プロジェクトを閉じました", "info");
  };

  const menus: readonly MenuGroup[] = [
    {
      label: t("menu.file"),
      items: [
        {
          label: t("menu.openProject"),
          shortcut: "Ctrl+O",
          action: () => {
            window.api.project.selectDirectory();
          },
        },
        {
          label: t("menu.closeProject"),
          action: handleCloseProject,
        },
        { separator: true, label: "" },
        {
          label: t("menu.exit"),
          shortcut: "Alt+F4",
          action: () => window.close(),
        },
      ],
    },
    {
      label: t("menu.view"),
      items: [
        {
          label: t("menu.toggleTheme"),
          shortcut: "Ctrl+Shift+D",
          action: () => setTheme(theme === "light" ? "dark" : "light"),
        },
        {
          label: t("menu.toggleLog"),
          shortcut: "Ctrl+L",
          action: () => toggleLogPanel(),
        },
        { separator: true, label: "" },
        {
          label: t("menu.zoomIn"),
          shortcut: "Ctrl++",
          action: () => {
            document.body.style.zoom = String(
              parseFloat(document.body.style.zoom || "1") + 0.1,
            );
          },
        },
        {
          label: t("menu.zoomOut"),
          shortcut: "Ctrl+-",
          action: () => {
            document.body.style.zoom = String(
              Math.max(0.5, parseFloat(document.body.style.zoom || "1") - 0.1),
            );
          },
        },
        {
          label: t("menu.zoomReset"),
          shortcut: "Ctrl+0",
          action: () => {
            document.body.style.zoom = "1";
          },
        },
      ],
    },
    {
      label: t("menu.help"),
      items: [
        {
          label: t("menu.userGuide"),
          action: () => navigate("/help"),
        },
        { separator: true, label: "" },
        {
          label: t("menu.about"),
          action: () => setShowAbout(true),
        },
      ],
    },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
      <div className="custom-menu-bar" ref={menuRef}>
        {menus.map((menu) => (
          <div key={menu.label} className="menu-group">
            <button
              className={`menu-trigger ${openMenu === menu.label ? "menu-trigger--open" : ""}`}
              onClick={() =>
                setOpenMenu(openMenu === menu.label ? null : menu.label)
              }
              onMouseEnter={() => {
                if (openMenu !== null) setOpenMenu(menu.label);
              }}
            >
              {menu.label}
            </button>
            {openMenu === menu.label && (
              <div className="menu-dropdown">
                {menu.items.map((item, i) =>
                  item.separator ? (
                    <div key={i} className="menu-separator" />
                  ) : (
                    <button
                      key={item.label}
                      className="menu-item"
                      onClick={() => {
                        item.action?.();
                        setOpenMenu(null);
                      }}
                    >
                      <span className="menu-item-label">{item.label}</span>
                      {item.shortcut && (
                        <span className="menu-item-shortcut">
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
