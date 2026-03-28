import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../helpers/render-with-providers";
import { HelpPage } from "../../../../src/renderer/pages/help-page";

describe("HelpPage", () => {
  it("renders help title", () => {
    renderWithProviders(<HelpPage />);
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
  });

  it("renders back button", () => {
    renderWithProviders(<HelpPage />);
    const backBtn = screen.getByRole("button", { name: /←|back/i });
    expect(backBtn).toBeDefined();
  });

  it("renders help sections", () => {
    renderWithProviders(<HelpPage />);
    const sections = screen.getAllByRole("heading", { level: 3 });
    expect(sections.length).toBeGreaterThan(0);
  });
});
