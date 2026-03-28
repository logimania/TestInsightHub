import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../helpers/render-with-providers";
import { DiagramPage } from "../../../../src/renderer/pages/diagram-page";
import { useProjectStore } from "../../../../src/renderer/stores/project-store";
import { useCoverageStore } from "../../../../src/renderer/stores/coverage-store";

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

  it("shows coverage hint when no coverage data", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [{ id: "src", name: "src", path: "src", files: [], fileCount: 1, functionCount: 0, totalLoc: 100, children: [] }],
        edges: [],
        totalFiles: 1,
        totalLoc: 100,
        parsedAt: "",
        parseErrors: [],
      },
    });
    useCoverageStore.setState({ moduleCoverages: [] });
    renderWithProviders(<DiagramPage />, { route: "/diagram" });
    expect(screen.getByText(/カバレッジ画面でテスト/)).toBeDefined();
  });

  it("displays overall coverage when module coverages exist", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [{ id: "src", name: "src", path: "src", files: [], fileCount: 1, functionCount: 0, totalLoc: 100, children: [] }],
        edges: [],
        totalFiles: 1,
        totalLoc: 100,
        parsedAt: "",
        parseErrors: [],
      },
    });
    useCoverageStore.setState({
      moduleCoverages: [
        {
          moduleId: "src",
          lineCoverage: { covered: 80, total: 100, percentage: 80 },
          branchCoverage: null,
          functionCoverage: { covered: 80, total: 100, percentage: 80 },
          files: [],
          colorLevel: "green",
        },
      ],
    });
    renderWithProviders(<DiagramPage />, { route: "/diagram" });
    expect(screen.getByText(/カバレッジ: 80\.0%/)).toBeDefined();
  });

  it("shows stats with modules, files, and loc counts", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [
          { id: "src/a", name: "a", path: "src/a", files: [], fileCount: 3, functionCount: 5, totalLoc: 200, children: [] },
          { id: "src/b", name: "b", path: "src/b", files: [], fileCount: 2, functionCount: 3, totalLoc: 150, children: [] },
        ],
        edges: [],
        totalFiles: 5,
        totalLoc: 350,
        parsedAt: "",
        parseErrors: [],
      },
    });
    renderWithProviders(<DiagramPage />, { route: "/diagram" });
    // Stats are rendered as "Modules: 2", "Files: 5", "LOC: 350" within spans
    const toolbar = document.querySelector(".diagram-stats");
    expect(toolbar).not.toBeNull();
    expect(toolbar!.textContent).toContain("2");
    expect(toolbar!.textContent).toContain("5");
    expect(toolbar!.textContent).toContain("350");
  });

  it("displays coverage color green for high percentage", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [{ id: "src", name: "src", path: "src", files: [], fileCount: 1, functionCount: 0, totalLoc: 100, children: [] }],
        edges: [],
        totalFiles: 1,
        totalLoc: 100,
        parsedAt: "",
        parseErrors: [],
      },
    });
    useCoverageStore.setState({
      moduleCoverages: [{
        moduleId: "src",
        lineCoverage: { covered: 90, total: 100, percentage: 90 },
        branchCoverage: null,
        functionCoverage: { covered: 90, total: 100, percentage: 90 },
        files: [],
        colorLevel: "green",
      }],
    });
    renderWithProviders(<DiagramPage />, { route: "/diagram" });
    const coverageText = screen.getByText(/カバレッジ: 90\.0%/);
    expect(coverageText.style.color).toBe("rgb(22, 163, 74)"); // #16a34a
  });

  it("displays coverage color yellow for medium percentage", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [{ id: "src", name: "src", path: "src", files: [], fileCount: 1, functionCount: 0, totalLoc: 100, children: [] }],
        edges: [],
        totalFiles: 1,
        totalLoc: 100,
        parsedAt: "",
        parseErrors: [],
      },
    });
    useCoverageStore.setState({
      moduleCoverages: [{
        moduleId: "src",
        lineCoverage: { covered: 60, total: 100, percentage: 60 },
        branchCoverage: null,
        functionCoverage: { covered: 60, total: 100, percentage: 60 },
        files: [],
        colorLevel: "yellow",
      }],
    });
    renderWithProviders(<DiagramPage />, { route: "/diagram" });
    const coverageText = screen.getByText(/カバレッジ: 60\.0%/);
    expect(coverageText.style.color).toBe("rgb(202, 138, 4)"); // #ca8a04
  });

  it("displays coverage color red for low percentage", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [{ id: "src", name: "src", path: "src", files: [], fileCount: 1, functionCount: 0, totalLoc: 100, children: [] }],
        edges: [],
        totalFiles: 1,
        totalLoc: 100,
        parsedAt: "",
        parseErrors: [],
      },
    });
    useCoverageStore.setState({
      moduleCoverages: [{
        moduleId: "src",
        lineCoverage: { covered: 20, total: 100, percentage: 20 },
        branchCoverage: null,
        functionCoverage: { covered: 20, total: 100, percentage: 20 },
        files: [],
        colorLevel: "red",
      }],
    });
    renderWithProviders(<DiagramPage />, { route: "/diagram" });
    const coverageText = screen.getByText(/カバレッジ: 20\.0%/);
    expect(coverageText.style.color).toBe("rgb(220, 38, 38)"); // #dc2626
  });

  it("computeOverall handles empty coverage array", () => {
    useProjectStore.setState({
      structure: {
        rootPath: "/p",
        modules: [{ id: "src", name: "src", path: "src", files: [], fileCount: 1, functionCount: 0, totalLoc: 100, children: [] }],
        edges: [],
        totalFiles: 1,
        totalLoc: 100,
        parsedAt: "",
        parseErrors: [],
      },
    });
    useCoverageStore.setState({ moduleCoverages: [] });
    renderWithProviders(<DiagramPage />, { route: "/diagram" });
    // No coverage percentage should be shown
    const text = document.querySelector(".diagram-overall-coverage");
    expect(text).toBeNull();
  });
});
