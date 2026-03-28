import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Toast, useToast } from "../../../../src/renderer/components/toast";

describe("Toast component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToast.setState({ message: null, type: "success" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when no message", () => {
    const { container } = render(<Toast />);
    expect(container.querySelector(".toast")).toBeNull();
  });

  it("renders toast with success message", () => {
    act(() => {
      useToast.getState().show("Success!");
    });
    const { container } = render(<Toast />);
    expect(screen.getByText("Success!")).toBeDefined();
    expect(container.querySelector(".toast--success")).not.toBeNull();
  });

  it("renders toast with error type", () => {
    act(() => {
      useToast.getState().show("Error!", "error");
    });
    const { container } = render(<Toast />);
    expect(screen.getByText("Error!")).toBeDefined();
    expect(container.querySelector(".toast--error")).not.toBeNull();
  });

  it("renders toast with info type", () => {
    act(() => {
      useToast.getState().show("Info message", "info");
    });
    const { container } = render(<Toast />);
    expect(screen.getByText("Info message")).toBeDefined();
    expect(container.querySelector(".toast--info")).not.toBeNull();
  });

  it("renders success icon ✓", () => {
    act(() => {
      useToast.getState().show("ok");
    });
    render(<Toast />);
    expect(screen.getByText("✓")).toBeDefined();
  });

  it("renders error icon ✗", () => {
    act(() => {
      useToast.getState().show("fail", "error");
    });
    render(<Toast />);
    expect(screen.getByText("✗")).toBeDefined();
  });

  it("renders info icon ℹ", () => {
    act(() => {
      useToast.getState().show("note", "info");
    });
    render(<Toast />);
    expect(screen.getByText("ℹ")).toBeDefined();
  });
});
