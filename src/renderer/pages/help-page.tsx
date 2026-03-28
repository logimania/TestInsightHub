import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export function HelpPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="page help-page">
      <div className="page-header">
        <button className="btn btn-link" onClick={() => navigate(-1)}>
          ← {t("help.back")}
        </button>
        <h2 className="page-title">{t("help.title")}</h2>
      </div>

      <div className="help-content">
        <section className="help-section">
          <h3>{t("help.overviewTitle")}</h3>
          <p>{t("help.overviewDesc")}</p>
        </section>

        <section className="help-section">
          <h3>{t("help.step1Title")}</h3>
          <div className="help-step">
            <span className="help-step-number">1</span>
            <div className="help-step-content">
              <p>{t("help.step1Desc")}</p>
              <ul className="help-list">
                <li>{t("help.step1Item1")}</li>
                <li>{t("help.step1Item2")}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h3>{t("help.step2Title")}</h3>
          <div className="help-step">
            <span className="help-step-number">2</span>
            <div className="help-step-content">
              <p>{t("help.step2Desc")}</p>
              <ul className="help-list">
                <li>{t("help.step2Item1")}</li>
                <li>{t("help.step2Item2")}</li>
                <li>{t("help.step2Item3")}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h3>{t("help.step3Title")}</h3>
          <div className="help-step">
            <span className="help-step-number">3</span>
            <div className="help-step-content">
              <p>{t("help.step3Desc")}</p>
              <ul className="help-list">
                <li>{t("help.step3Item1")}</li>
                <li>{t("help.step3Item2")}</li>
                <li>{t("help.step3Item3")}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h3>{t("help.step4Title")}</h3>
          <div className="help-step">
            <span className="help-step-number">4</span>
            <div className="help-step-content">
              <p>{t("help.step4Desc")}</p>
              <ul className="help-list">
                <li>{t("help.step4Item1")}</li>
                <li>{t("help.step4Item2")}</li>
                <li>{t("help.step4Item3")}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h3>{t("help.step5Title")}</h3>
          <div className="help-step">
            <span className="help-step-number">5</span>
            <div className="help-step-content">
              <p>{t("help.step5Desc")}</p>
              <ul className="help-list">
                <li>{t("help.step5Item1")}</li>
                <li>{t("help.step5Item2")}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h3>{t("help.step6Title")}</h3>
          <div className="help-step">
            <span className="help-step-number">6</span>
            <div className="help-step-content">
              <p>{t("help.step6Desc")}</p>
              <ul className="help-list">
                <li>{t("help.step6Item1")}</li>
                <li>{t("help.step6Item2")}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="help-section">
          <h3>{t("help.shortcutsTitle")}</h3>
          <table className="help-shortcuts-table">
            <thead>
              <tr>
                <th>{t("help.shortcutKey")}</th>
                <th>{t("help.shortcutAction")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ctrl+1</td>
                <td>{t("help.scHome")}</td>
              </tr>
              <tr>
                <td>Ctrl+2</td>
                <td>{t("help.scDiagram")}</td>
              </tr>
              <tr>
                <td>Ctrl+3</td>
                <td>{t("help.scCoverage")}</td>
              </tr>
              <tr>
                <td>Ctrl+4</td>
                <td>{t("help.scFeedback")}</td>
              </tr>
              <tr>
                <td>Ctrl+,</td>
                <td>{t("help.scSettings")}</td>
              </tr>
              <tr>
                <td>Ctrl+L</td>
                <td>{t("help.scLog")}</td>
              </tr>
              <tr>
                <td>Ctrl+Shift+D</td>
                <td>{t("help.scTheme")}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="help-section">
          <h3>{t("help.supportedTitle")}</h3>
          <div className="help-two-col">
            <div>
              <h4>{t("help.languagesTitle")}</h4>
              <ul className="help-list">
                <li>TypeScript / JavaScript</li>
                <li>Python</li>
                <li>Go</li>
                <li>Rust</li>
                <li>C / C++</li>
              </ul>
            </div>
            <div>
              <h4>{t("help.coverageFormatsTitle")}</h4>
              <ul className="help-list">
                <li>Istanbul JSON (Vitest, Jest)</li>
                <li>lcov.info</li>
                <li>coverage.py JSON (pytest)</li>
                <li>Go coverprofile</li>
                <li>llvm-cov JSON (cargo)</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
