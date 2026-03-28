import { ipcMain, dialog } from "electron";
import { IPC_CHANNELS } from "@shared/types/ipc";
import type { CoverageLoadRequest } from "@shared/types/ipc";
import { loadCoverage } from "../services/coverage-analyzer";
import { AppErrorImpl } from "@shared/types/errors";

let lastRootPath: string | null = null;

export function registerCoverageHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.COVERAGE_LOAD,
    async (_event, request: CoverageLoadRequest) => {
      const rootPath = lastRootPath ?? "";
      let reportPath = request.reportPath;

      if (!reportPath && !request.autoDetect) {
        const result = await dialog.showOpenDialog({
          properties: ["openFile"],
          title: "カバレッジレポートを選択",
          filters: [
            {
              name: "Coverage Reports",
              extensions: ["json", "info", "txt", "out"],
            },
          ],
        });
        if (result.canceled || result.filePaths.length === 0) {
          throw new AppErrorImpl({
            code: "COVERAGE_NOT_LOADED",
            message: "カバレッジレポートが選択されませんでした",
            recoverable: true,
          });
        }
        reportPath = result.filePaths[0];
      }

      const result = await loadCoverage({
        rootPath,
        reportPath,
        autoDetect: request.autoDetect,
      });

      if (result.matchRate < 50 && result.unmatchedFiles.length > 0) {
        // Warning logged but data still returned
      }

      return result.coverage;
    },
  );
}

export function setLastRootPath(rootPath: string): void {
  lastRootPath = rootPath;
}
