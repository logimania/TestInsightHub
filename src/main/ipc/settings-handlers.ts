import { ipcMain } from "electron";
import { IPC_CHANNELS } from "@shared/types/ipc";
import type { GlobalSettings, ProjectSettings } from "@shared/types/settings";
import {
  loadGlobalSettings,
  saveGlobalSettings,
  loadProjectSettings,
  saveProjectSettings,
  loadRecentProjects,
} from "../services/settings-manager";

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_LOAD_GLOBAL, async () => {
    return loadGlobalSettings();
  });

  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_SAVE_GLOBAL,
    async (_event, settings: GlobalSettings) => {
      await saveGlobalSettings(settings);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_LOAD_PROJECT,
    async (_event, projectId: string) => {
      return loadProjectSettings(projectId);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_SAVE_PROJECT,
    async (_event, settings: ProjectSettings) => {
      await saveProjectSettings(settings);
    },
  );

  ipcMain.handle(IPC_CHANNELS.RECENT_PROJECTS_LOAD, async () => {
    return loadRecentProjects();
  });
}
