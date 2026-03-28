import type { BrowserWindow } from "electron";
import { registerProjectHandlers } from "./project-handlers";
import { registerCoverageHandlers } from "./coverage-handlers";
import { registerTestHandlers } from "./test-handlers";
import { registerFeedbackHandlers } from "./feedback-handlers";
import { registerSettingsHandlers } from "./settings-handlers";
import { registerExportHandlers } from "./export-handlers";

export function registerAllHandlers(mainWindow: BrowserWindow): void {
  registerProjectHandlers(mainWindow);
  registerCoverageHandlers();
  registerTestHandlers(mainWindow);
  registerFeedbackHandlers();
  registerSettingsHandlers();
  registerExportHandlers();
}
