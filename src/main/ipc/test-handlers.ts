import { ipcMain, BrowserWindow } from "electron";
import { IPC_CHANNELS } from "@shared/types/ipc";
import type { TestRunRequest, TestQualityRequest } from "@shared/types/ipc";
import type { ProjectStructure } from "@shared/types/project";
import { runAllTestsWithCoverage } from "../services/test-runner";
import { analyzeTestQuality } from "../services/test-quality-analyzer";
import { mapTestsToCoverage } from "../services/coverage-analyzer/test-source-mapper";

let lastProjectStructure: ProjectStructure | null = null;

export function registerTestHandlers(mainWindow: BrowserWindow): void {
  // project:parse の結果を保持してテスト実行時に使う
  ipcMain.on(
    IPC_CHANNELS.PROJECT_PARSE_RESULT,
    (_event, structure: ProjectStructure) => {
      lastProjectStructure = structure;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.TEST_RUN,
    async (_event, request: TestRunRequest) => {
      const result = await runAllTestsWithCoverage({
        rootPath: request.rootPath,
        customCommand: request.customCommand,
        timeoutMs: request.timeoutMs,
        onOutput: (line, stream) => {
          mainWindow.webContents.send(IPC_CHANNELS.TEST_RUN_OUTPUT, {
            line,
            stream,
          });
        },
      });

      if (!result.coverageResult?.coverage) return null;

      let coverage = result.coverageResult.coverage;

      // プロジェクト構造があれば、テスト→ソースの紐付けを実行
      if (lastProjectStructure) {
        const allFiles = lastProjectStructure.modules.flatMap((m) => m.files);
        const mappedFiles = mapTestsToCoverage(allFiles, [...coverage.files]);
        coverage = { ...coverage, files: mappedFiles };
      }

      return coverage;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.TEST_QUALITY_ANALYZE,
    async (_event, request: TestQualityRequest) => {
      return analyzeTestQuality(request.testFilePaths, request.rootPath);
    },
  );
}

export function setProjectStructure(structure: ProjectStructure): void {
  lastProjectStructure = structure;
}
