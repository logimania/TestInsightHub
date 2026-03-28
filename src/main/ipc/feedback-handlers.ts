import { ipcMain } from "electron";
import { join } from "path";
import { IPC_CHANNELS } from "@shared/types/ipc";
import type {
  FeedbackGenerateRequest,
  FeedbackDeployRequest,
} from "@shared/types/ipc";
import {
  FEEDBACK_DEFAULT_DEPLOY_DIR,
  FEEDBACK_DEFAULT_FILENAME,
} from "@shared/constants";
import { AppErrorImpl } from "@shared/types/errors";
import { generateFeedback } from "../services/feedback-generator";
import { deployFeedback } from "../services/feedback-generator/feedback-deployer";
import { compareFeedback } from "../services/feedback-generator/cycle-tracker";
import type { FeedbackFile } from "@shared/types/feedback";

let lastProjectRoot: string | null = null;
let lastFeedback: FeedbackFile | null = null;

export function registerFeedbackHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.FEEDBACK_GENERATE,
    async (_event, _request: FeedbackGenerateRequest) => {
      // NOTE: Full integration requires project structure and coverage data
      // passed from renderer. For now, throw a descriptive error.
      throw new AppErrorImpl({
        code: "FEEDBACK_NO_DATA",
        message:
          "フィードバック生成にはプロジェクト解析とカバレッジデータが必要です。先にプロジェクトを読み込み、カバレッジを取得してください。",
        recoverable: true,
      });
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.FEEDBACK_DEPLOY,
    async (_event, request: FeedbackDeployRequest) => {
      const deployPath =
        request.deployPath ||
        join(
          lastProjectRoot ?? ".",
          FEEDBACK_DEFAULT_DEPLOY_DIR,
          FEEDBACK_DEFAULT_FILENAME,
        );

      const result = await deployFeedback(request.feedbackFile, deployPath);
      lastFeedback = request.feedbackFile;
      return { success: result.success, backupPath: result.backupPath };
    },
  );

  ipcMain.handle(IPC_CHANNELS.FEEDBACK_HISTORY, async () => {
    return [];
  });

  ipcMain.handle(IPC_CHANNELS.FEEDBACK_COMPARE, async () => {
    return null;
  });
}

export function setLastProjectRoot(rootPath: string): void {
  lastProjectRoot = rootPath;
}
