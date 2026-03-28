import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../helpers/render-with-providers";
import { AboutDialog } from "../../../../src/renderer/components/about-dialog";

describe("AboutDialog", () => {
  const mockOnClose = vi.fn();

  it("renders app name", () => {
    renderWithProviders(<AboutDialog onClose={mockOnClose} />);
    expect(screen.getByText("Test Insight Hub")).toBeDefined();
  });

  it("renders version", () => {
    renderWithProviders(<AboutDialog onClose={mockOnClose} />);
    expect(screen.getByText(/Version 0\.1\.0/)).toBeDefined();
  });

  it("renders close button", () => {
    renderWithProviders(<AboutDialog onClose={mockOnClose} />);
    const closeBtn = screen.getByRole("button", { name: /閉じる/ });
    expect(closeBtn).toBeDefined();
  });

  it("calls onClose when close button clicked", () => {
    renderWithProviders(<AboutDialog onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole("button", { name: /閉じる/ }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when overlay clicked", () => {
    const { container } = renderWithProviders(
      <AboutDialog onClose={mockOnClose} />,
    );
    const overlay = container.querySelector(".about-overlay")!;
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders feature list", () => {
    renderWithProviders(<AboutDialog onClose={mockOnClose} />);
    expect(screen.getByText(/ブロック図可視化/)).toBeDefined();
  });
});
