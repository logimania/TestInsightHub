import { describe, it, expect, beforeEach, vi } from "vitest";
import { useProjectStore } from "../../../../src/renderer/stores/project-store";

const mockParse = vi.fn();
const mockOnParseProgress = vi.fn();
vi.stubGlobal("window", {
  api: {
    project: { parse: mockParse },
    onParseProgress: mockOnParseProgress,
  },
});

describe("useProjectStore", () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
    mockParse.mockReset();
    mockOnParseProgress.mockReset();
  });

  it("has correct initial state", () => {
    const state = useProjectStore.getState();
    expect(state.structure).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.parseProgress).toBeNull();
    expect(state.parseErrors).toEqual([]);
  });

  it("loadProject sets structure on success", async () => {
    const structure = {
      rootPath: "/project",
      modules: [],
      edges: [],
      totalFiles: 5,
      totalLoc: 100,
      parsedAt: "2026-01-01",
      parseErrors: [],
    };
    mockParse.mockResolvedValue(structure);

    await useProjectStore.getState().loadProject("/project");

    const state = useProjectStore.getState();
    expect(state.structure).toEqual(structure);
    expect(state.isLoading).toBe(false);
    expect(mockParse).toHaveBeenCalledWith({
      rootPath: "/project",
      testRootPath: undefined,
    });
    expect(mockOnParseProgress).toHaveBeenCalled();
  });

  it("loadProject sets parseErrors on failure", async () => {
    mockParse.mockRejectedValue(new Error("parse failed"));

    await expect(
      useProjectStore.getState().loadProject("/bad"),
    ).rejects.toThrow("parse failed");

    const state = useProjectStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.parseErrors.length).toBe(1);
    expect(state.parseErrors[0].message).toBe("parse failed");
  });

  it("reset clears all state", async () => {
    const structure = {
      rootPath: "/p",
      modules: [],
      edges: [],
      totalFiles: 1,
      totalLoc: 10,
      parsedAt: "",
      parseErrors: [],
    };
    mockParse.mockResolvedValue(structure);
    await useProjectStore.getState().loadProject("/p");
    expect(useProjectStore.getState().structure).not.toBeNull();

    useProjectStore.getState().reset();
    const state = useProjectStore.getState();
    expect(state.structure).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.parseProgress).toBeNull();
    expect(state.parseErrors).toEqual([]);
  });
});
