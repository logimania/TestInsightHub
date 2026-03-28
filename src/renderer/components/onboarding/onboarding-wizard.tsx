import { useState } from "react";
import { useTranslation } from "react-i18next";

interface OnboardingWizardProps {
  readonly onComplete: () => void;
}

const TOTAL_STEPS = 3;

export function OnboardingWizard({
  onComplete,
}: OnboardingWizardProps): JSX.Element {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: t("onboarding.step1Title"),
      description: t("onboarding.step1Desc"),
      icon: "📂",
    },
    {
      title: t("onboarding.step2Title"),
      description: t("onboarding.step2Desc"),
      icon: "📊",
    },
    {
      title: t("onboarding.step3Title"),
      description: t("onboarding.step3Desc"),
      icon: "📝",
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-icon">{currentStep.icon}</div>
        <h2 className="onboarding-title">{currentStep.title}</h2>
        <p className="onboarding-desc">{currentStep.description}</p>

        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`onboarding-dot ${i === step ? "onboarding-dot--active" : ""}`}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          {step > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => setStep(step - 1)}
            >
              {t("onboarding.back")}
            </button>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep(step + 1)}
            >
              {t("onboarding.next")}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onComplete}>
              {t("onboarding.start")}
            </button>
          )}
        </div>

        <button className="onboarding-skip" onClick={onComplete}>
          {t("onboarding.skip")}
        </button>
      </div>
    </div>
  );
}
