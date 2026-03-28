import { writeFile, readFile, rename, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import type { FeedbackFile } from "@shared/types/feedback";
import { AppErrorImpl } from "@shared/types/errors";

export interface DeployResult {
  readonly success: boolean;
  readonly deployedPath: string;
  readonly backupPath?: string;
}

export async function deployFeedback(
  feedbackFile: FeedbackFile,
  deployPath: string,
): Promise<DeployResult> {
  const dir = dirname(deployPath);

  try {
    await mkdir(dir, { recursive: true });
  } catch {
    throw new AppErrorImpl({
      code: "DEPLOY_PERMISSION_DENIED",
      message:
        "書き込み権限がありません。別の配置先を選択するか、ディレクトリの権限を確認してください。",
      recoverable: true,
    });
  }

  let backupPath: string | undefined;
  if (existsSync(deployPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const ext = deployPath.endsWith(".json") ? ".json" : "";
    const base = deployPath.replace(/\.json$/, "");
    backupPath = `${base}.${timestamp}.bak${ext}`;

    try {
      await rename(deployPath, backupPath);
    } catch {
      // Backup failed, continue with overwrite
      backupPath = undefined;
    }
  }

  try {
    const content = JSON.stringify(feedbackFile, null, 2);
    await writeFile(deployPath, content, "utf-8");
  } catch {
    throw new AppErrorImpl({
      code: "DEPLOY_DISK_FULL",
      message:
        "ディスク容量が不足しています。空き容量を確保してから再度実行してください。",
      recoverable: true,
    });
  }

  return {
    success: true,
    deployedPath: deployPath,
    backupPath,
  };
}

export async function suggestGitignore(
  projectRoot: string,
  dirName: string,
): Promise<boolean> {
  const gitignorePath = join(projectRoot, ".gitignore");
  if (!existsSync(gitignorePath)) return false;

  try {
    const content = await readFile(gitignorePath, "utf-8");
    return !content.includes(dirName);
  } catch {
    return false;
  }
}
