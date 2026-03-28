import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { MenuBar } from "./components/layout/menu-bar";
import { Sidebar } from "./components/layout/sidebar";
import { Header } from "./components/layout/header";
import { Toast } from "./components/toast";
import { ProgressBarGlobal } from "./components/progress-bar-global";
import { LogPanel } from "./components/layout/log-panel";
import { OnboardingWizard } from "./components/onboarding/onboarding-wizard";
import { HomePage } from "./pages/home-page";
import { DiagramPage } from "./pages/diagram-page";
import { CoveragePage } from "./pages/coverage-page";
import { FeedbackPage } from "./pages/feedback-page";
import { FeedbackHistoryPage } from "./pages/feedback-history-page";
import { SettingsPage } from "./pages/settings-page";
import { HelpPage } from "./pages/help-page";
import { useUiStore } from "./stores/ui-store";
import { KeyboardShortcutProvider } from "./components/keyboard-shortcut-provider";

const ONBOARDING_KEY = "tih-onboarding-completed";

export function App(): JSX.Element {
  const theme = useUiStore((state) => state.theme);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = (): void => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  };

  return (
    <div className={`app ${theme}`}>
      <Toast />
      {showOnboarding && (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}
      <HashRouter>
        <KeyboardShortcutProvider />
        <MenuBar />
        <div className="app-layout">
          <Sidebar />
          <div className="app-content">
            <Header />
            <main className="app-main">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/diagram" element={<DiagramPage />} />
                <Route path="/coverage" element={<CoveragePage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route
                  path="/feedback/history"
                  element={<FeedbackHistoryPage />}
                />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <LogPanel />
            <ProgressBarGlobal />
          </div>
        </div>
      </HashRouter>
    </div>
  );
}
