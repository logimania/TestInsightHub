import { exec } from "child_process";
import { promisify } from "util";
import { stat } from "fs/promises";
import {
  CHANGE_FREQUENCY_DAYS,
  CHANGE_FREQUENCY_RECENT_DAYS,
  CHANGE_FREQUENCY_RECENT_SCORE,
} from "@shared/constants";

const execAsync = promisify(exec);

export async function isGitRepository(rootPath: string): Promise<boolean> {
  try {
    await execAsync("git rev-parse --is-inside-work-tree", { cwd: rootPath });
    return true;
  } catch {
    return false;
  }
}

export async function getFileCommitCount(
  rootPath: string,
  filePath: string,
  days: number = CHANGE_FREQUENCY_DAYS,
): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `git log --follow --since="${days} days ago" --format="%H" -- "${filePath}"`,
      { cwd: rootPath, timeout: 10000 },
    );
    const lines = stdout.trim().split("\n").filter(Boolean);
    return lines.length;
  } catch {
    return 0;
  }
}

export async function getMaxCommitCount(
  rootPath: string,
  filePaths: readonly string[],
  days: number = CHANGE_FREQUENCY_DAYS,
): Promise<number> {
  let max = 1;
  for (const fp of filePaths) {
    const count = await getFileCommitCount(rootPath, fp, days);
    if (count > max) max = count;
  }
  return max;
}

export async function getChangeFrequencyScore(
  rootPath: string,
  filePath: string,
  maxCount: number,
  isGitRepo: boolean,
): Promise<number> {
  if (isGitRepo) {
    const count = await getFileCommitCount(rootPath, filePath);
    return Math.min(Math.round((count / maxCount) * 100), 100);
  }

  try {
    const fileStat = await stat(filePath);
    const daysSinceModified =
      (Date.now() - fileStat.mtimeMs) / (1000 * 60 * 60 * 24);
    return daysSinceModified <= CHANGE_FREQUENCY_RECENT_DAYS
      ? CHANGE_FREQUENCY_RECENT_SCORE
      : 0;
  } catch {
    return 0;
  }
}
