import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../helpers/render-with-providers";
import { Sidebar } from "../../../../../src/renderer/components/layout/sidebar";

describe("Sidebar", () => {
  it("renders navigation element", () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByRole("navigation")).toBeDefined();
  });

  it("renders 5 navigation links", () => {
    renderWithProviders(<Sidebar />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBe(5);
  });

  it("renders TIH title", () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByText("TIH")).toBeDefined();
  });

  it("contains link to home (/)", () => {
    renderWithProviders(<Sidebar />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/");
  });

  it("contains link to coverage", () => {
    renderWithProviders(<Sidebar />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/coverage");
  });

  it("contains link to feedback", () => {
    renderWithProviders(<Sidebar />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/feedback");
  });

  it("contains link to settings", () => {
    renderWithProviders(<Sidebar />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/settings");
  });

  it("renders sidebar labels", () => {
    renderWithProviders(<Sidebar />);
    // Check that nav labels exist (translated from i18n)
    const labels = screen.getAllByText(/.+/);
    expect(labels.length).toBeGreaterThan(5); // title + 5 labels + icons
  });
});
