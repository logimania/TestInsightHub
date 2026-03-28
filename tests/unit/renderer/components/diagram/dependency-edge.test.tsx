import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@xyflow/react", () => ({
  BaseEdge: ({ path, style }: any) => (
    <path data-testid="base-edge" d={path} style={style} />
  ),
  EdgeLabelRenderer: ({ children }: any) => (
    <div data-testid="edge-label-renderer">{children}</div>
  ),
  getBezierPath: () => ["M0,0 C10,10 20,20 30,30", 15, 15],
}));

import { DependencyEdge } from "../../../../../src/renderer/components/diagram/dependency-edge";

const makeProps = (overrides: Record<string, any> = {}) =>
  ({
    id: "e-1",
    source: "a",
    target: "b",
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 100,
    sourcePosition: "bottom" as any,
    targetPosition: "top" as any,
    data: { weight: 1, isCyclic: false },
    markerEnd: undefined,
    ...overrides,
  }) as any;

describe("DependencyEdge", () => {
  it("renders a base edge", () => {
    render(
      <svg>
        <DependencyEdge {...makeProps()} />
      </svg>,
    );
    expect(screen.getByTestId("base-edge")).toBeDefined();
  });

  it("renders with normal style for non-cyclic edge", () => {
    render(
      <svg>
        <DependencyEdge {...makeProps()} />
      </svg>,
    );
    const edge = screen.getByTestId("base-edge");
    expect(edge.style.stroke).toBe("#9ca3af");
  });

  it("renders with red style for cyclic edge", () => {
    render(
      <svg>
        <DependencyEdge
          {...makeProps({ data: { weight: 1, isCyclic: true } })}
        />
      </svg>,
    );
    const edge = screen.getByTestId("base-edge");
    expect(edge.style.stroke).toBe("#dc2626");
  });

  it("does not show weight label when weight is 1", () => {
    render(
      <svg>
        <DependencyEdge {...makeProps()} />
      </svg>,
    );
    expect(screen.queryByTestId("edge-label-renderer")).toBeNull();
  });

  it("shows weight label when weight > 1", () => {
    render(
      <svg>
        <DependencyEdge
          {...makeProps({ data: { weight: 3, isCyclic: false } })}
        />
      </svg>,
    );
    expect(screen.getByTestId("edge-label-renderer")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  it("handles missing data gracefully", () => {
    render(
      <svg>
        <DependencyEdge {...makeProps({ data: undefined })} />
      </svg>,
    );
    const edge = screen.getByTestId("base-edge");
    expect(edge.style.stroke).toBe("#9ca3af");
  });

  it("caps stroke width at 5", () => {
    render(
      <svg>
        <DependencyEdge
          {...makeProps({ data: { weight: 10, isCyclic: false } })}
        />
      </svg>,
    );
    const edge = screen.getByTestId("base-edge");
    expect(edge.style.strokeWidth).toBe("5");
  });
});
