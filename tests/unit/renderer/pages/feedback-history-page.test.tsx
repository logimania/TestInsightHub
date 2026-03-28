import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../helpers/render-with-providers";
import { FeedbackHistoryPage } from "../../../../src/renderer/pages/feedback-history-page";
import { useFeedbackStore } from "../../../../src/renderer/stores/feedback-store";

vi.stubGlobal("window", {
  api: { feedback: { deploy: vi.fn() } },
});

describe("FeedbackHistoryPage", () => {
  beforeEach(() => {
    useFeedbackStore.getState().reset();
  });

  it("renders page title", () => {
    renderWithProviders(<FeedbackHistoryPage />, {
      route: "/feedback/history",
    });
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
  });

  it("renders back button", () => {
    renderWithProviders(<FeedbackHistoryPage />, {
      route: "/feedback/history",
    });
    const backBtn = screen.getByRole("button", { name: /←|back|戻る/i });
    expect(backBtn).toBeDefined();
  });

  it("shows empty state when no history", () => {
    renderWithProviders(<FeedbackHistoryPage />, {
      route: "/feedback/history",
    });
    expect(screen.getByText("フィードバック履歴はありません")).toBeDefined();
  });

  it("renders history entries when available", () => {
    useFeedbackStore.setState({
      history: [
        {
          version: "1.3.0",
          generatedAt: "2026-01-01T00:00:00Z",
          projectRoot: "/project",
          coverageThreshold: 80,
          qualityGate: { passed: false, verdict: "不合格", moduleResults: [], failedModules: ["src/renderer"] },
          summary: { totalModules: 3, belowThreshold: 1, totalUncoveredFunctions: 5, overallCoverage: 65 },
          gaps: [{ filePath: "src/renderer/app.tsx", moduleName: "src/renderer", currentCoverage: 30, targetCoverage: 80, uncoveredLines: [], recommendedTestType: "e2e" as const, priority: "high" as const, priorityScore: 70, complexity: 5, changeFrequency: 0 }],
          recommendations: [],
        },
      ],
    });
    renderWithProviders(<FeedbackHistoryPage />, { route: "/feedback/history" });
    expect(screen.getByText(/65/)).toBeDefined();
    expect(screen.getByText(/#1/)).toBeDefined();
  });

  it("renders expanded entry with gap details when clicked", () => {
    useFeedbackStore.setState({
      history: [
        {
          version: "1.3.0",
          generatedAt: "2026-01-01T00:00:00Z",
          projectRoot: "/project",
          coverageThreshold: 80,
          qualityGate: { passed: false, verdict: "不合格", moduleResults: [], failedModules: [] },
          summary: { totalModules: 2, belowThreshold: 1, totalUncoveredFunctions: 3, overallCoverage: 50 },
          gaps: [{ filePath: "src/api/handler.ts", moduleName: "src/api", currentCoverage: 20, targetCoverage: 80, uncoveredLines: [], recommendedTestType: "unit" as const, priority: "high" as const, priorityScore: 75, complexity: 5, changeFrequency: 0 }],
          recommendations: [],
        },
      ],
    });
    renderWithProviders(<FeedbackHistoryPage />, { route: "/feedback/history" });
    // Click to expand
    fireEvent.click(screen.getByText(/#1/));
    // Should show gap details
    expect(screen.getByText(/src\/api\/handler\.ts/)).toBeDefined();
    expect(screen.getByText(/HIGH/)).toBeDefined();
  });

  it("renders comparison when available", () => {
    useFeedbackStore.setState({
      history: [
        {
          version: "1.3.0",
          generatedAt: "2026-01-01T00:00:00Z",
          projectRoot: "/project",
          coverageThreshold: 80,
          qualityGate: { passed: false, verdict: "", moduleResults: [], failedModules: [] },
          summary: { totalModules: 1, belowThreshold: 0, totalUncoveredFunctions: 0, overallCoverage: 70 },
          gaps: [],
          recommendations: [],
        },
      ],
      comparison: {
        previousFeedbackAt: "2026-01-01T00:00:00Z",
        currentFeedbackAt: "2026-01-02T00:00:00Z",
        improved: [{ filePath: "src/a.ts", previousCoverage: 30, currentCoverage: 80, targetCoverage: 80 }],
        unchanged: [],
        newGaps: [],
        improvementRate: 100,
      },
    });
    renderWithProviders(<FeedbackHistoryPage />, { route: "/feedback/history" });
    expect(screen.getByText(/100/)).toBeDefined(); // improvement rate
  });
});
