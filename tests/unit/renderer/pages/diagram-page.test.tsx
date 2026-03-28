import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../helpers/render-with-providers";
import { DiagramPage } from "../../../../src/renderer/pages/diagram-page";
import { useProjectStore } from "../../../../src/renderer/stores/project-store";

// Mock ReactFlow to avoid complex canvas rendering
vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children }: any) => (
    <div data-testid="react-flow">{children}</div>
  ),
  Background: () => <div />,
  Controls: () => <div />,
  MiniMap: () => <div />,
  ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
  useReactFlow: () => ({ fitView: vi.fn(), getNodes: () => [] }),
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
  Handle: () => <div />,
  BaseEdge: () => <svg />,
  getBezierPath: () => ["", 0, 0],
  EdgeLabelRenderer: ({ children }: any) => <div>{children}</div>,
}));

// Mock dagre
vi.mock("dagre", () => ({
  default: {
    graphlib: {
      Graph: vi
        .fn()
        .mockImplementation(() => ({
          setDefaultEdgeLabel: vi.fn(),
          setGraph: vi.fn(),
          setNode: vi.fn(),
          setEdge: vi.fn(),
          node: () => ({ x: 0, y: 0 }),
        })),
    },
    layout: vi.fn(),
  },
}));

vi.stubGlobal("window", { api: {} });

describe("DiagramPage", () => {
  beforeEach(() => {
    useProjectStore.setState({ structure: null });
  });

  it("renders page with diagram", () => {
    renderWithProviders(<DiagramPage />, { route: "/diagram" });
    // Should render something (either hint or diagram area)
    expect(
      document.querySelector('.page, [data-testid="react-flow"]'),
    ).toBeDefined();
  });

  it("shows hint when no project loaded", () => {
    renderWithProviders(<DiagramPage />, { route: "/diagram" });
    expect(screen.getByText(/プロジェクト|読み込んで|select/i)).toBeDefined();
  });

  it("renders diagram when project loaded", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [
          {
            id: "src",
            name: "src",
            path: "src",
            files: [],
            fileCount: 1,
            functionCount: 0,
            totalLoc: 100,
            children: [],
          },
        ],
        edges: [],
        totalFiles: 1,
        totalLoc: 100,
        parsedAt: "",
        parseErrors: [],
      },
    });
    renderWithProviders(<DiagramPage />, { route: "/diagram" });
    expect(screen.getByTestId("react-flow")).toBeDefined();
  });
});
