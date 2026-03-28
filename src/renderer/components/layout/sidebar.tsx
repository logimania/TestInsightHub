import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

function IconHome(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="homeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <filter id="homeShadow">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="0.8"
            floodColor="#2563eb"
            floodOpacity="0.4"
          />
        </filter>
      </defs>
      <path
        d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        fill="url(#homeGrad)"
        filter="url(#homeShadow)"
      />
      <rect x="9" y="14" width="6" height="8" rx="1" fill="#dbeafe" />
    </svg>
  );
}

function IconDiagram(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="diagGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="diagGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="diagShadow">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="0.8"
            floodColor="#7c3aed"
            floodOpacity="0.4"
          />
        </filter>
      </defs>
      <rect
        x="2"
        y="2"
        width="8"
        height="7"
        rx="2"
        fill="url(#diagGrad1)"
        filter="url(#diagShadow)"
      />
      <rect
        x="14"
        y="2"
        width="8"
        height="7"
        rx="2"
        fill="url(#diagGrad2)"
        filter="url(#diagShadow)"
      />
      <rect
        x="8"
        y="15"
        width="8"
        height="7"
        rx="2"
        fill="url(#diagGrad1)"
        filter="url(#diagShadow)"
      />
      <line x1="6" y1="9" x2="12" y2="15" stroke="#a78bfa" strokeWidth="2" />
      <line x1="18" y1="9" x2="12" y2="15" stroke="#a78bfa" strokeWidth="2" />
    </svg>
  );
}

function IconCoverage(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="barGreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="barYellow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="barRed" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        <filter id="barShadow">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="0.6"
            floodColor="#000"
            floodOpacity="0.2"
          />
        </filter>
      </defs>
      <rect
        x="3"
        y="14"
        width="4"
        height="7"
        rx="1"
        fill="url(#barRed)"
        filter="url(#barShadow)"
      />
      <rect
        x="10"
        y="8"
        width="4"
        height="13"
        rx="1"
        fill="url(#barYellow)"
        filter="url(#barShadow)"
      />
      <rect
        x="17"
        y="3"
        width="4"
        height="18"
        rx="1"
        fill="url(#barGreen)"
        filter="url(#barShadow)"
      />
      <line x1="2" y1="21" x2="22" y2="21" stroke="#9ca3af" strokeWidth="1.5" />
    </svg>
  );
}

function IconFeedback(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="feedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <filter id="feedShadow">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="0.8"
            floodColor="#d97706"
            floodOpacity="0.4"
          />
        </filter>
      </defs>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        fill="url(#feedGrad)"
        filter="url(#feedShadow)"
      />
      <path d="M14 2v6h6" fill="#fde68a" stroke="#f59e0b" strokeWidth="0.5" />
      <line
        x1="8"
        y1="13"
        x2="16"
        y2="13"
        stroke="#92400e"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="17"
        x2="13"
        y2="17"
        stroke="#92400e"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSettings(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
        <filter id="gearShadow">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="0.8"
            floodColor="#4b5563"
            floodOpacity="0.4"
          />
        </filter>
      </defs>
      <path
        d="M12 1l1.5 3.2a7 7 0 0 1 2.6 1.5L19.3 5l1.7 3-2.7 2a7 7 0 0 1 0 3l2.7 2-1.7 3-3.2-.7a7 7 0 0 1-2.6 1.5L12 23l-1.5-3.2a7 7 0 0 1-2.6-1.5L4.7 19 3 16l2.7-2a7 7 0 0 1 0-3L3 9l1.7-3 3.2.7a7 7 0 0 1 2.6-1.5z"
        fill="url(#gearGrad)"
        filter="url(#gearShadow)"
      />
      <circle cx="12" cy="12" r="3.5" fill="#e5e7eb" />
    </svg>
  );
}

const ICONS: Record<string, () => JSX.Element> = {
  "/": IconHome,
  "/diagram": IconDiagram,
  "/coverage": IconCoverage,
  "/feedback": IconFeedback,
  "/settings": IconSettings,
};

export function Sidebar(): JSX.Element {
  const { t } = useTranslation();

  const navItems = [
    { to: "/", label: t("nav.home") },
    { to: "/diagram", label: t("nav.diagram") },
    { to: "/coverage", label: t("nav.coverage") },
    { to: "/feedback", label: t("nav.feedback") },
    { to: "/settings", label: t("nav.settings") },
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">TIH</h1>
      </div>
      <ul className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = ICONS[item.to];
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
                }
              >
                <span className="sidebar-icon">{Icon && <Icon />}</span>
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
