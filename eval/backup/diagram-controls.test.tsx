import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  DiagramControls,
} from "../../../../../src/renderer/components/diagram/diagram-controls";

const makeProps = (overrides: Record<string, unknown> = {}) => ({
  layout: "hierarchical" as const,
  nodeSize: "medium" as const,
  onLayoutChange: vi.fn(),
  onNodeSizeChange: vi.fn(),
  onFitView: vi.fn(),
  onExport: vi.fn(),
  ...overrides,
});

describe("DiagramControls", () => {
  it("renders layout buttons", () => {
    render(<DiagramControls {...makeProps()} />);
    expect(screen.getByText("階層")).toBeDefined();
    expect(screen.getByText("力指向")).toBeDefined();
  });

  it("applies active class to hierarchical layout by default", () => {
    render(<DiagramControls {...makeProps()} />);
    const hierarchicalBtn = screen.getByText("階層");
    expect(hierarchicalBtn.className).toContain("control-btn--active");
    const forceBtn = screen.getByText("力指向");
    expect(forceBtn.className).not.toContain("control-btn--active");
  });

  it("applies active class to force layout when selected", () => {
    render(<DiagramControls {...makeProps({ layout: "force" })} />);
    const forceBtn = screen.getByText("力指向");
    expect(forceBtn.className).toContain("control-btn--active");
    const hierarchicalBtn = screen.getByText("階層");
    expect(hierarchicalBtn.className).not.toContain("control-btn--active");
  });

  it("calls onLayoutChange when layout button clicked", () => {
    const onLayoutChange = vi.fn();
    render(<DiagramControls {...makeProps({ onLayoutChange })} />);
    fireEvent.click(screen.getByText("力指向"));
    expect(onLayoutChange).toHaveBeenCalledWith("force");
    fireEvent.click(screen.getByText("階層"));
    expect(onLayoutChange).toHaveBeenCalledWith("hierarchical");
  });

  it("renders node size buttons with labels", () => {
    render(<DiagramControls {...makeProps()} />);
    expect(screen.getByText("小")).toBeDefined();
    expect(screen.getByText("中")).toBeDefined();
    expect(screen.getByText("大")).toBeDefined();
  });

  it("applies active class to current node size", () => {
    render(<DiagramControls {...makeProps({ nodeSize: "large" })} />);
    const largeBtn = screen.getByText("大");
    expect(largeBtn.className).toContain("control-btn--active");
    const mediumBtn = screen.getByText("中");
    expect(mediumBtn.className).not.toContain("control-btn--active");
    const smallBtn = screen.getByText("小");
    expect(smallBtn.className).not.toContain("control-btn--active");
  });

  it("calls onNodeSizeChange when size button clicked", () => {
    const onNodeSizeChange = vi.fn();
    render(<DiagramControls {...makeProps({ onNodeSizeChange })} />);
    fireEvent.click(screen.getByText("小"));
    expect(onNodeSizeChange).toHaveBeenCalledWith("small");
    fireEvent.click(screen.getByText("大"));
    expect(onNodeSizeChange).toHaveBeenCalledWith("large");
  });

  it("renders fit view button and calls onFitView when clicked", () => {
    const onFitView = vi.fn();
    render(<DiagramControls {...makeProps({ onFitView })} />);
    const btn = screen.getByText("全体表示");
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(onFitView).toHaveBeenCalledOnce();
  });

  it("renders export buttons", () => {
    render(<DiagramControls {...makeProps()} />);
    expect(screen.getByText("PNG")).toBeDefined();
    expect(screen.getByText("SVG")).toBeDefined();
  });

  it("calls onExport with png when PNG button clicked", () => {
    const onExport = vi.fn();
    render(<DiagramControls {...makeProps({ onExport })} />);
    fireEvent.click(screen.getByText("PNG"));
    expect(onExport).toHaveBeenCalledWith("png");
  });

  it("calls onExport with svg when SVG button clicked", () => {
    const onExport = vi.fn();
    render(<DiagramControls {...makeProps({ onExport })} />);
    fireEvent.click(screen.getByText("SVG"));
    expect(onExport).toHaveBeenCalledWith("svg");
  });

  it("renders size label text", () => {
    render(<DiagramControls {...makeProps()} />);
    expect(screen.getByText("文字サイズ:")).toBeDefined();
  });
});
