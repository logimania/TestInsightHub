import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../helpers/render-with-providers";
import { SettingsPage } from "../../../../src/renderer/pages/settings-page";
import { useSettingsStore } from "../../../../src/renderer/stores/settings-store";
import { useUiStore } from "../../../../src/renderer/stores/ui-store";

const mockLoadGlobal = vi.fn().mockResolvedValue(null);
const mockSaveGlobal = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal("window", {
  api: {
    settings: {
      loadGlobal: mockLoadGlobal,
      saveGlobal: mockSaveGlobal,
    },
  },
});

describe("SettingsPage", () => {
  beforeEach(() => {
    useUiStore.setState({ theme: "light", locale: "ja", logs: [] });
    useSettingsStore.setState({ globalSettings: null });
    vi.clearAllMocks();
  });

  it("renders settings title", () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
  });

  it("renders theme selector", () => {
    renderWithProviders(<SettingsPage />);
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it("renders save button", () => {
    renderWithProviders(<SettingsPage />);
    const saveBtn = screen.getByRole("button", { name: /保存|save/i });
    expect(saveBtn).toBeDefined();
  });

  it("renders coverage threshold input", () => {
    renderWithProviders(<SettingsPage />);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders advanced settings toggle", () => {
    renderWithProviders(<SettingsPage />);
    const advBtn = screen.getByRole("button", { name: /▶|advanced|詳細/i });
    expect(advBtn).toBeDefined();
  });

  it("shows advanced settings when toggled", () => {
    renderWithProviders(<SettingsPage />);
    const advBtn = screen.getByRole("button", { name: /▶|advanced|詳細/i });
    fireEvent.click(advBtn);
    // After toggle, more inputs should appear (weight inputs)
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs.length).toBeGreaterThanOrEqual(4); // threshold + green + yellow + weights
  });
});
