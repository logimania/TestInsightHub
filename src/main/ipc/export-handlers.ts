import { ipcMain, dialog } from "electron";
import { writeFile } from "fs/promises";
import { IPC_CHANNELS } from "@shared/types/ipc";
import type { ExportDiagramRequest } from "@shared/types/ipc";
import {
  clearProjectCache,
  clearAllCache,
  getCacheStats,
} from "../services/cache-manager";

export function registerExportHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.EXPORT_DIAGRAM,
    async (_event, request: ExportDiagramRequest) => {
      let outputPath = request.outputPath;

      if (!outputPath) {
        const ext = request.format === "svg" ? "svg" : "png";
        const result = await dialog.showSaveDialog({
          title: "ブロック図をエクスポート",
          defaultPath: `diagram.${ext}`,
          filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
        });
        if (result.canceled || !result.filePath) return "";
        outputPath = result.filePath;
      }

      if (request.format === "svg") {
        // html-to-image returns data:image/svg+xml;... or raw SVG
        let svgData = request.svgContent;
        if (svgData.startsWith("data:image/svg+xml;")) {
          // Strip data URL prefix: data:image/svg+xml;charset=utf-8, or base64
          const commaIdx = svgData.indexOf(",");
          const encoded = svgData.slice(commaIdx + 1);
          if (svgData.includes("base64")) {
            svgData = Buffer.from(encoded, "base64").toString("utf-8");
          } else {
            svgData = decodeURIComponent(encoded);
          }
        }
        await writeFile(outputPath, svgData, "utf-8");
      } else {
        // PNG: data:image/png;base64,...
        const base64Data = request.svgContent.replace(
          /^data:image\/png;base64,/,
          "",
        );
        await writeFile(outputPath, Buffer.from(base64Data, "base64"));
      }

      return outputPath;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.CACHE_CLEAR,
    async (_event, projectId?: string) => {
      if (projectId) {
        await clearProjectCache(projectId);
      } else {
        await clearAllCache();
      }
    },
  );
}
