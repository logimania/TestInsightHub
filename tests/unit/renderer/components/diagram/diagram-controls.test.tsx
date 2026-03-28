import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  DiagramControls,
} from "../../../../../src/renderer/components/diagram/diagram-controls";

const defaultProps = {
  layout: "hierarchical" as const,
  nodeSize: "medium" as const,
  onLayoutChange: vi.fn(),
  onNodeSizeChange: vi.fn(),
  onFitView: vi.fn(),
  onExport: vi.fn(),
};

const makeProps = (overrides: Record<string, any> = {}) => ({
  ...defaultProps,
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

  it("renders node size buttons with labels", () => {
    render(<DiagramControls {...makeProps()} />);
    expect(screen.getByText("小")).toBeDefined();
    expect(screen.getByText("中")).toBeDefined();
    expect(screen.getByText("大")).toBeDefined();
  });

  it("renders size label text", () => {
    render(<DiagramControls {...makeProps()} />);
    expect(screen.getByText("文字サイズ:")).toBeDefined();
  });

  it("renders fit view button", () => {
    render(<DiagramControls {...makeProps()} />);
    expect(screen.getByText("全体表示")).toBeDefined();
  });

  it("renders export buttons", () => {
    render(<DiagramControls {...makeProps()} />);
    expect(screen.getByText("PNG")).toBeDefined();
    expect(screen.getByText("SVG")).toBeDefined();
  });

  it("marks hierarchical button active when layout is hierarchical", () => {
    render(<DiagramControls {...makeProps({ layout: "hierarchical" })} />);
    const btn = screen.getByText("階層");
    expect(btn.className).toContain("control-btn--active");
  });

  it("marks force button active when layout is force", () => {
    render(<DiagramControls {...makeProps({ layout: "force" })} />);
    const btn = screen.getByText("力指向");
    expect(btn.className).toContain("control-btn--active");
  });

  it("marks current node size button active", () => {
    render(<DiagramControls {...makeProps({ nodeSize: "large" })} />);
    const btn = screen.getByText("大");
    expect(btn.className).toContain("control-btn--active");
  });

  it("calls onLayoutChange with hierarchical when clicked", () => {
    const props = makeProps();
    render(<DiagramControls {...props} />);
    fireEvent.click(screen.getByText("階層"));
    expect(props.onLayoutChange).toHaveBeenCalledWith("hierarchical");
  });

  it("calls onLayoutChange with force when clicked", () => {
    const props = makeProps();
    render(<DiagramControls {...props} />);
    fireEvent.click(screen.getByText("力指向"));
    expect(props.onLayoutChange).toHaveBeenCalledWith("force");
  });

  it("calls onNodeSizeChange with small when clicked", () => {
    const props = makeProps();
    render(<DiagramControls {...props} />);
    fireEvent.click(screen.getByText("小"));
    expect(props.onNodeSizeChange).toHaveBeenCalledWith("small");
  });

  it("calls onNodeSizeChange with medium when clicked", () => {
    const props = makeProps();
    render(<DiagramControls {...props} />);
    fireEvent.click(screen.getByText("中"));
    expect(props.onNodeSizeChange).toHaveBeenCalledWith("medium");
  });

  it("calls onNodeSizeChange with large when clicked", () => {
    const props = makeProps();
    render(<DiagramControls {...props} />);
    fireEvent.click(screen.getByText("大"));
    expect(props.onNodeSizeChange).toHaveBeenCalledWith("large");
  });

  it("calls onFitView when fit view button clicked", () => {
    const props = makeProps();
    render(<DiagramControls {...props} />);
    fireEvent.click(screen.getByText("全体表示"));
    expect(props.onFitView).toHaveBeenCalledOnce();
  });

  it("calls onExport with png when PNG button clicked", () => {
    const props = makeProps();
    render(<DiagramControls {...props} />);
    fireEvent.click(screen.getByText("PNG"));
    expect(props.onExport).toHaveBeenCalledWith("png");
  });

  it("calls onExport with svg when SVG button clicked", () => {
    const props = makeProps();
    render(<DiagramControls {...props} />);
    fireEvent.click(screen.getByText("SVG"));
    expect(props.onExport).toHaveBeenCalledWith("svg");
  });
});
