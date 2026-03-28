import { ipcMain, dialog, BrowserWindow } from "electron";
import { basename } from "path";
import { IPC_CHANNELS } from "@shared/types/ipc";
import type { ParseProjectRequest } from "@shared/types/ipc";
import { AppErrorImpl } from "@shared/types/errors";
import { parseProject } from "../services/project-parser";
import { addRecentProject } from "../services/settings-manager";
import { generateProjectId } from "../utils/hash-utils";
import { setProjectStructure } from "./test-handlers";

export function registerProjectHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.PROJECT_SELECT_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "プロジェクトディレクトリを選択",
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle(
    IPC_CHANNELS.PROJECT_PARSE,
    async (_event, request: ParseProjectRequest) => {
      const { rootPath } = request;

      try {
        const structure = await parseProject({
          rootPath,
          onProgress: (current, total, file) => {
            mainWindow.webContents.send(IPC_CHANNELS.PROJECT_PARSE_PROGRESS, {
              current,
              total,
              currentFile: file,
            });
          },
        });

        if (structure.totalFiles === 0) {
          throw new AppErrorImpl({
            code: "NO_SOURCE_FILES",
            message:
              "対応するソースファイルが見つかりません。対応言語: TypeScript, JavaScript, Python, Go, Rust, C/C++",
            recoverable: true,
          });
        }

        const projectId = generateProjectId(rootPath);
        await addRecentProject({
          projectId,
          projectName: basename(rootPath),
          rootPath,
          lastOpenedAt: new Date().toISOString(),
        });

        setProjectStructure(structure);
        return structure;
      } catch (error) {
        if (error instanceof AppErrorImpl) throw error;
        throw new AppErrorImpl({
          code: "PARSE_ERROR",
          message: "プロジェクトの解析中にエラーが発生しました",
          detail: error instanceof Error ? error.message : String(error),
          recoverable: true,
        });
      }
    },
  );
}
