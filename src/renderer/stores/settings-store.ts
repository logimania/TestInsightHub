import { create } from "zustand";
import type {
  GlobalSettings,
  ProjectSettings,
  RecentProject,
} from "@shared/types/settings";

interface SettingsState {
  readonly globalSettings: GlobalSettings | null;
  readonly projectSettings: ProjectSettings | null;
  readonly recentProjects: readonly RecentProject[];
  readonly loadGlobalSettings: () => Promise<void>;
  readonly saveGlobalSettings: (settings: GlobalSettings) => Promise<void>;
  readonly loadProjectSettings: (projectId: string) => Promise<void>;
  readonly saveProjectSettings: (settings: ProjectSettings) => Promise<void>;
  readonly loadRecentProjects: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  globalSettings: null,
  projectSettings: null,
  recentProjects: [],

  loadGlobalSettings: async () => {
    const globalSettings = await window.api.settings.loadGlobal();
    set({ globalSettings });
  },

  saveGlobalSettings: async (settings) => {
    await window.api.settings.saveGlobal(settings);
    set({ globalSettings: settings });
  },

  loadProjectSettings: async (projectId) => {
    const projectSettings = await window.api.settings.loadProject(projectId);
    set({ projectSettings });
  },

  saveProjectSettings: async (settings) => {
    await window.api.settings.saveProject(settings);
    set({ projectSettings: settings });
  },

  loadRecentProjects: async () => {
    const recentProjects = await window.api.settings.loadRecentProjects();
    set({ recentProjects });
  },
}));
