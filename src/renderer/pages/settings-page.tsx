import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../stores/ui-store";
import { useSettingsStore } from "../stores/settings-store";
import {
  DEFAULT_COVERAGE_THRESHOLD,
  DEFAULT_COLOR_THRESHOLDS,
  DEFAULT_PRIORITY_WEIGHTS,
} from "@shared/constants";
import type { GlobalSettings } from "@shared/types/settings";

export function SettingsPage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const locale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);
  const addLog = useUiStore((s) => s.addLog);
  const globalSettings = useSettingsStore((s) => s.globalSettings);
  const loadGlobalSettings = useSettingsStore((s) => s.loadGlobalSettings);
  const saveGlobalSettings = useSettingsStore((s) => s.saveGlobalSettings);

  const [threshold, setThreshold] = useState(DEFAULT_COVERAGE_THRESHOLD);
  const [greenThreshold, setGreenThreshold] = useState(
    DEFAULT_COLOR_THRESHOLDS.green,
  );
  const [yellowThreshold, setYellowThreshold] = useState(
    DEFAULT_COLOR_THRESHOLDS.yellow,
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [coverageWeight, setCoverageWeight] = useState(
    DEFAULT_PRIORITY_WEIGHTS.coverageGapWeight,
  );
  const [complexityWeight, setComplexityWeight] = useState(
    DEFAULT_PRIORITY_WEIGHTS.complexityWeight,
  );
  const [changeFreqWeight, setChangeFreqWeight] = useState(
    DEFAULT_PRIORITY_WEIGHTS.changeFreqWeight,
  );

  useEffect(() => {
    loadGlobalSettings();
  }, [loadGlobalSettings]);

  useEffect(() => {
    if (globalSettings) {
      setThreshold(globalSettings.defaultCoverageThreshold);
      setGreenThreshold(globalSettings.defaultColorThresholds.green);
      setYellowThreshold(globalSettings.defaultColorThresholds.yellow);
      setCoverageWeight(
        globalSettings.defaultPriorityWeights.coverageGapWeight,
      );
      setComplexityWeight(
        globalSettings.defaultPriorityWeights.complexityWeight,
      );
      setChangeFreqWeight(
        globalSettings.defaultPriorityWeights.changeFreqWeight,
      );
    }
  }, [globalSettings]);

  const handleLocaleChange = (newLocale: "ja" | "en"): void => {
    setLocale(newLocale);
    i18n.changeLanguage(newLocale);
  };

  const handleSave = async (): Promise<void> => {
    const updated: GlobalSettings = {
      theme,
      locale,
      maxCacheSizeBytes:
        globalSettings?.maxCacheSizeBytes ?? 2 * 1024 * 1024 * 1024,
      defaultCoverageThreshold: threshold,
      defaultColorThresholds: {
        green: greenThreshold,
        yellow: yellowThreshold,
      },
      defaultPriorityWeights: {
        coverageGapWeight: coverageWeight,
        complexityWeight: complexityWeight,
        changeFreqWeight: changeFreqWeight,
      },
    };
    await saveGlobalSettings(updated);
    addLog("info", t("settings.saved"));
  };

  return (
    <div className="page settings-page">
      <h2 className="page-title">{t("settings.title")}</h2>

      <section className="settings-section">
        <h3>{t("settings.appearance")}</h3>
        <div className="setting-row">
          <label>{t("settings.theme")}</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "light" | "dark")}
          >
            <option value="light">{t("settings.themes.light")}</option>
            <option value="dark">{t("settings.themes.dark")}</option>
          </select>
        </div>
        <div className="setting-row">
          <label>{t("settings.language")}</label>
          <select
            value={locale}
            onChange={(e) => handleLocaleChange(e.target.value as "ja" | "en")}
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </div>
      </section>

      <section className="settings-section">
        <h3>{t("settings.defaults")}</h3>
        <div className="setting-row">
          <label>{t("settings.coverageThreshold")}</label>
          <div className="setting-input-group">
            <input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
            <span>%</span>
          </div>
        </div>
        <div className="setting-row">
          <label>{t("settings.greenThreshold")}</label>
          <div className="setting-input-group">
            <input
              type="number"
              min={0}
              max={100}
              value={greenThreshold}
              onChange={(e) => setGreenThreshold(Number(e.target.value))}
            />
            <span>%</span>
          </div>
        </div>
        <div className="setting-row">
          <label>{t("settings.yellowThreshold")}</label>
          <div className="setting-input-group">
            <input
              type="number"
              min={0}
              max={100}
              value={yellowThreshold}
              onChange={(e) => setYellowThreshold(Number(e.target.value))}
            />
            <span>%</span>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h3>
          <button
            className="btn btn-link"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "▼" : "▶"} {t("settings.advancedSettings")}
          </button>
        </h3>
        {showAdvanced && (
          <div className="settings-advanced">
            <p className="settings-hint">{t("settings.weightsHint")}</p>
            <div className="setting-row">
              <label>{t("settings.coverageGapWeight")}</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={coverageWeight}
                onChange={(e) => setCoverageWeight(Number(e.target.value))}
              />
            </div>
            <div className="setting-row">
              <label>{t("settings.complexityWeight")}</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={complexityWeight}
                onChange={(e) => setComplexityWeight(Number(e.target.value))}
              />
            </div>
            <div className="setting-row">
              <label>{t("settings.changeFreqWeight")}</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={changeFreqWeight}
                onChange={(e) => setChangeFreqWeight(Number(e.target.value))}
              />
            </div>
          </div>
        )}
      </section>

      <div className="settings-actions">
        <button className="btn btn-primary" onClick={handleSave}>
          {t("settings.save")}
        </button>
      </div>
    </div>
  );
}
