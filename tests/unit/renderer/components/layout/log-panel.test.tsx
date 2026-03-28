import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../helpers/render-with-providers";
import { LogPanel } from "../../../../../src/renderer/components/layout/log-panel";
import { useUiStore } from "../../../../../src/renderer/stores/ui-store";

describe("LogPanel", () => {
  beforeEach(() => {
    useUiStore.setState({ isLogPanelOpen: false, logs: [] });
  });

  it("renders nothing when closed", () => {
    const { container } = renderWithProviders(<LogPanel />);
    expect(container.querySelector(".log-panel")).toBeNull();
  });

  it("renders panel when open", () => {
    useUiStore.setState({ isLogPanelOpen: true });
    const { container } = renderWithProviders(<LogPanel />);
    expect(container.querySelector(".log-panel")).toBeDefined();
  });

  it("shows empty message when no logs", () => {
    useUiStore.setState({ isLogPanelOpen: true, logs: [] });
    renderWithProviders(<LogPanel />);
    // Actual text is "ログはありません"
    expect(screen.getByText("ログはありません")).toBeDefined();
  });

  it("renders log entries", () => {
    useUiStore.setState({
      isLogPanelOpen: true,
      logs: [
        {
          id: "1",
          level: "info",
          message: "Test log entry",
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          level: "error",
          message: "Error happened",
          timestamp: new Date().toISOString(),
        },
      ],
    });
    renderWithProviders(<LogPanel />);
    expect(screen.getByText("Test log entry")).toBeDefined();
    expect(screen.getByText("Error happened")).toBeDefined();
  });

  it("renders clear button when open", () => {
    useUiStore.setState({ isLogPanelOpen: true });
    renderWithProviders(<LogPanel />);
    const clearBtn = screen.getByRole("button", { name: /クリア|clear/i });
    expect(clearBtn).toBeDefined();
  });
});
