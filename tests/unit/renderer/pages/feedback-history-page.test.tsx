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
          version: "1.1.0",
          generatedAt: "2026-01-01T00:00:00Z",
          projectRoot: "/project",
          coverageThreshold: 80,
          summary: {
            totalModules: 3,
            belowThreshold: 1,
            totalUncoveredFunctions: 5,
            overallCoverage: 65,
          },
          gaps: [],
          recommendations: [],
        },
      ],
    });
    renderWithProviders(<FeedbackHistoryPage />, {
      route: "/feedback/history",
    });
    expect(screen.getByText(/65/)).toBeDefined(); // overall coverage
  });
});
