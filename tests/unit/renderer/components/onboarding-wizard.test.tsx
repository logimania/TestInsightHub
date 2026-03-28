import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../helpers/render-with-providers";
import { OnboardingWizard } from "../../../../src/renderer/components/onboarding/onboarding-wizard";

describe("OnboardingWizard", () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
  });

  it("renders first step", () => {
    renderWithProviders(<OnboardingWizard onComplete={mockOnComplete} />);
    // Should show step 1 content
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
  });

  it("renders next button on first step", () => {
    renderWithProviders(<OnboardingWizard onComplete={mockOnComplete} />);
    const nextBtn = screen.getByRole("button", { name: /次へ|next/i });
    expect(nextBtn).toBeDefined();
  });

  it("does not render back button on first step", () => {
    renderWithProviders(<OnboardingWizard onComplete={mockOnComplete} />);
    expect(screen.queryByRole("button", { name: /戻る|back/i })).toBeNull();
  });

  it("navigates to step 2 on next click", () => {
    renderWithProviders(<OnboardingWizard onComplete={mockOnComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /次へ|next/i }));
    // Step 2 should now show back button
    expect(screen.getByRole("button", { name: /戻る|back/i })).toBeDefined();
  });

  it("shows start button on last step", () => {
    renderWithProviders(<OnboardingWizard onComplete={mockOnComplete} />);
    // Navigate to step 3
    fireEvent.click(screen.getByRole("button", { name: /次へ|next/i }));
    fireEvent.click(screen.getByRole("button", { name: /次へ|next/i }));
    // Should show start button instead of next
    const startBtn = screen.getByRole("button", { name: /始める|start/i });
    expect(startBtn).toBeDefined();
  });

  it("calls onComplete when start clicked", () => {
    renderWithProviders(<OnboardingWizard onComplete={mockOnComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /次へ|next/i }));
    fireEvent.click(screen.getByRole("button", { name: /次へ|next/i }));
    fireEvent.click(screen.getByRole("button", { name: /始める|start/i }));
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("renders skip button", () => {
    renderWithProviders(<OnboardingWizard onComplete={mockOnComplete} />);
    const skipBtn = screen.getByRole("button", { name: /スキップ|skip/i });
    expect(skipBtn).toBeDefined();
  });

  it("calls onComplete when skip clicked", () => {
    renderWithProviders(<OnboardingWizard onComplete={mockOnComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /スキップ|skip/i }));
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("renders step indicators (dots)", () => {
    const { container } = renderWithProviders(
      <OnboardingWizard onComplete={mockOnComplete} />,
    );
    const dots = container.querySelectorAll(".onboarding-dot");
    expect(dots.length).toBe(3);
  });
});
