import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  DiagramControls,
  type LayoutMode,
  type NodeSize,
} from "../../../../../src/renderer/components/diagram/diagram-controls";

function createProps(overrides: Partial<{
  layout: LayoutMode;
  nodeSize: NodeSize;
  onLayoutChange: ReturnType<typeof vi.fn>;
  onNodeSizeChange: ReturnType<typeof vi.fn>;
  onFitView: ReturnType<typeof vi.fn>;
  onExport: ReturnType<typeof vi.fn>;
}> = {}) {
  return {
    layout: "hierarchical" as LayoutMode,
    nodeSize: "medium" as NodeSize,
    onLayoutChange: vi.fn(),
    onNodeSizeChange: vi.fn(),
    onFitView: vi.fn(),
    onExport: vi.fn(),
    ...overrides,
  };
}

describe("DiagramControls", () => {
  it("renders layout toggle buttons", () => {
    render(<DiagramControls {...createProps()} />);
    expect(screen.getByText("階層")).toBeDefined();
    expect(screen.getByText("力指向")).toBeDefined();
  });

  it("renders node size buttons with Japanese labels", () => {
    render(<DiagramControls {...createProps()} />);
    expect(screen.getByText("小")).toBeDefined();
    expect(screen.getByText("中")).toBeDefined();
    expect(screen.getByText("大")).toBeDefined();
  });

  it("renders the fit-view button", () => {
    render(<DiagramControls {...createProps()} />);
    expect(screen.getByText("全体表示")).toBeDefined();
  });

  it("renders PNG and SVG export buttons", () => {
    render(<DiagramControls {...createProps()} />);
    expect(screen.getByText("PNG")).toBeDefined();
    expect(screen.getByText("SVG")).toBeDefined();
  });

  it("highlights the hierarchical button when layout is hierarchical", () => {
    render(<DiagramControls {...createProps({ layout: "hierarchical" })} />);
    expect(screen.getByText("階層").className).toContain("control-btn--active");
    expect(screen.getByText("力指向").className).not.toContain("control-btn--active");
  });

  it("highlights the force button when layout is force", () => {
    render(<DiagramControls {...createProps({ layout: "force" })} />);
    expect(screen.getByText("力指向").className).toContain("control-btn--active");
    expect(screen.getByText("階層").className).not.toContain("control-btn--active");
  });

  it("highlights the active node size button only", () => {
    render(<DiagramControls {...createProps({ nodeSize: "large" })} />);
    expect(screen.getByText("大").className).toContain("control-btn--active");
    expect(screen.getByText("小").className).not.toContain("control-btn--active");
    expect(screen.getByText("中").className).not.toContain("control-btn--active");
  });

  it("calls onLayoutChange with the selected layout", () => {
    const props = createProps();
    render(<DiagramControls {...props} />);
    fireEvent.click(screen.getByText("力指向"));
    expect(props.onLayoutChange).toHaveBeenCalledWith("force");
  });

  it("calls onNodeSizeChange with the selected size", () => {
    const props = createProps();
    render(<DiagramControls {...props} />);
    fireEvent.click(screen.getByText("小"));
    expect(props.onNodeSizeChange).toHaveBeenCalledWith("small");

    fireEvent.click(screen.getByText("大"));
    expect(props.onNodeSizeChange).toHaveBeenCalledWith("large");
  });

  it("calls onFitView when fit-view button is clicked", () => {
    const props = createProps();
    render(<DiagramControls {...props} />);
    fireEvent.click(screen.getByText("全体表示"));
    expect(props.onFitView).toHaveBeenCalledTimes(1);
  });

  it("calls onExport with png format", () => {
    const props = createProps();
    render(<DiagramControls {...props} />);
    fireEvent.click(screen.getByText("PNG"));
    expect(props.onExport).toHaveBeenCalledWith("png");
  });

  it("calls onExport with svg format", () => {
    const props = createProps();
    render(<DiagramControls {...props} />);
    fireEvent.click(screen.getByText("SVG"));
    expect(props.onExport).toHaveBeenCalledWith("svg");
  });
});
