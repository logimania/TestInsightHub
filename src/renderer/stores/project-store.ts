import { create } from "zustand";
import type { ProjectStructure, ParseError } from "@shared/types/project";
import type { ParseProgressEvent } from "@shared/types/ipc";

interface ProjectState {
  readonly structure: ProjectStructure | null;
  readonly isLoading: boolean;
  readonly parseProgress: ParseProgressEvent | null;
  readonly parseErrors: readonly ParseError[];
  readonly loadProject: (
    rootPath: string,
    testRootPath?: string,
  ) => Promise<void>;
  readonly reset: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  structure: null,
  isLoading: false,
  parseProgress: null,
  parseErrors: [],

  loadProject: async (rootPath, testRootPath) => {
    set({ isLoading: true, parseProgress: null, parseErrors: [] });

    window.api.onParseProgress((event) => {
      set({ parseProgress: event });
    });

    try {
      const structure = await window.api.project.parse({
        rootPath,
        testRootPath,
      });
      set({ structure, isLoading: false, parseProgress: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      set({
        isLoading: false,
        parseProgress: null,
        parseErrors: [{ filePath: rootPath, message }],
      });
      throw error;
    }
  },

  reset: () => {
    set({
      structure: null,
      isLoading: false,
      parseProgress: null,
      parseErrors: [],
    });
  },
}));
