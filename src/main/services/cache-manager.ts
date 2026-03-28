import { readdir, stat, rm, mkdir } from "fs/promises";
import { join } from "path";
import { app } from "electron";

export interface CacheStats {
  readonly totalSizeBytes: number;
  readonly fileCount: number;
  readonly projectCount: number;
}

function getCacheBasePath(): string {
  return join(app.getPath("userData"), "projects");
}

export async function getCacheStats(): Promise<CacheStats> {
  const basePath = getCacheBasePath();
  let totalSize = 0;
  let fileCount = 0;
  let projectCount = 0;

  try {
    const projects = await readdir(basePath, { withFileTypes: true });
    for (const project of projects) {
      if (!project.isDirectory()) continue;
      projectCount++;
      const cachePath = join(basePath, project.name, "cache");
      try {
        const files = await readdir(cachePath);
        for (const file of files) {
          const fileStat = await stat(join(cachePath, file));
          totalSize += fileStat.size;
          fileCount++;
        }
      } catch {
        // cache dir doesn't exist for this project
      }
    }
  } catch {
    // projects dir doesn't exist yet
  }

  return { totalSizeBytes: totalSize, fileCount, projectCount };
}

export async function clearProjectCache(projectId: string): Promise<void> {
  const cachePath = join(getCacheBasePath(), projectId, "cache");
  try {
    await rm(cachePath, { recursive: true, force: true });
    await mkdir(cachePath, { recursive: true });
  } catch {
    // ignore if doesn't exist
  }
}

export async function clearAllCache(): Promise<void> {
  const basePath = getCacheBasePath();
  try {
    const projects = await readdir(basePath, { withFileTypes: true });
    for (const project of projects) {
      if (!project.isDirectory()) continue;
      await clearProjectCache(project.name);
    }
  } catch {
    // ignore
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(1)} ${units[i]}`;
}
