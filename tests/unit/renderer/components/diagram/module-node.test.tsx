import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock @xyflow/react
vi.mock("@xyflow/react", () => ({
  Handle: () => <div data-testid="handle" />,
  Position: { Top: "top", Bottom: "bottom" },
  memo: (fn: any) => fn,
}));

import { ModuleNodeRenderer } from "../../../../../src/renderer/components/diagram/module-node";

const makeProps = (overrides: Record<string, any> = {}) =>
  ({
    id: "node-1",
    type: "moduleNode",
    data: {
      module: {
        id: "src/api",
        name: "api",
        path: "src/api",
        files: [],
        fileCount: 5,
        functionCount: 12,
        totalLoc: 300,
        children: [],
      },
      coverage: {
        moduleId: "src/api",
        lineCoverage: { covered: 80, total: 100, percentage: 80 },
        branchCoverage: null,
        functionCoverage: { covered: 90, total: 100, percentage: 90 },
        files: [],
        colorLevel: "green" as const,
      },
      isExpanded: false,
      onExpand: vi.fn(),
      ...overrides,
    },
    position: { x: 0, y: 0 },
    dragging: false,
    zIndex: 1,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    selected: false,
    deletable: false,
    parentId: undefined,
    sourcePosition: undefined,
    targetPosition: undefined,
    dragHandle: undefined,
    width: 280,
    height: 160,
  }) as any;

describe("ModuleNodeRenderer", () => {
  it("renders module name", () => {
    render(<ModuleNodeRenderer {...makeProps()} />);
    expect(screen.getByText("api/")).toBeDefined();
  });

  it("renders file count", () => {
    render(<ModuleNodeRenderer {...makeProps()} />);
    expect(screen.getByText(/Files: 5/)).toBeDefined();
  });

  it("renders function count", () => {
    render(<ModuleNodeRenderer {...makeProps()} />);
    expect(screen.getByText(/Fn: 12/)).toBeDefined();
  });

  it("renders LOC", () => {
    render(<ModuleNodeRenderer {...makeProps()} />);
    expect(screen.getByText(/LOC: 300/)).toBeDefined();
  });

  it("renders coverage percentage", () => {
    render(<ModuleNodeRenderer {...makeProps()} />);
    expect(screen.getByText(/80/)).toBeDefined();
  });

  it("renders without coverage", () => {
    render(<ModuleNodeRenderer {...makeProps({ coverage: undefined })} />);
    expect(screen.getByText("api/")).toBeDefined();
  });

  it("renders handles for connections", () => {
    render(<ModuleNodeRenderer {...makeProps()} />);
    const handles = screen.getAllByTestId("handle");
    expect(handles.length).toBeGreaterThanOrEqual(1);
  });
});
