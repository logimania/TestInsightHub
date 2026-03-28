import { join } from "path";
import { readFile } from "fs/promises";
import {
  parseGitignore,
  isIgnored,
  isExcludedDir,
  detectLanguage,
  listDirectory,
  toRelativePath,
} from "../../utils/file-utils";
import type { GitignorePattern } from "../../utils/file-utils";
import type { Language } from "@shared/types/project";
import { LARGE_PROJECT_WARNING_THRESHOLD } from "@shared/constants";

export interface ScannedFile {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly language: Language;
}

export interface ScanResult {
  readonly files: readonly ScannedFile[];
  readonly totalScanned: number;
  readonly skippedByIgnore: number;
  readonly isLargeProject: boolean;
}

export async function scanProject(
  rootPath: string,
  excludePatterns: readonly string[] = [],
  onProgress?: (current: number, currentFile: string) => void,
): Promise<ScanResult> {
  const gitignorePatterns = await loadGitignorePatterns(rootPath);
  const allPatterns = [
    ...gitignorePatterns,
    ...excludePatterns.map((p) => ({
      pattern: p,
      negated: false,
      regex: new RegExp(p.replace(/\*/g, ".*")),
    })),
  ];

  const files: ScannedFile[] = [];
  let totalScanned = 0;
  let skippedByIgnore = 0;
  const visitedPaths = new Set<string>();

  async function walk(dirPath: string): Promise<void> {
    let entries;
    try {
      entries = await listDirectory(dirPath);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relPath = toRelativePath(rootPath, fullPath);

      if (entry.isSymbolicLink()) {
        const realPath = fullPath;
        if (visitedPaths.has(realPath)) {
          continue;
        }
        visitedPaths.add(realPath);
      }

      if (entry.isDirectory()) {
        if (isExcludedDir(entry.name)) {
          continue;
        }
        if (isIgnored(relPath, allPatterns)) {
          skippedByIgnore++;
          continue;
        }
        await walk(fullPath);
      } else if (entry.isFile()) {
        totalScanned++;
        if (isIgnored(relPath, allPatterns)) {
          skippedByIgnore++;
          continue;
        }
        const language = detectLanguage(entry.name);
        if (language) {
          files.push({
            absolutePath: fullPath,
            relativePath: relPath,
            language,
          });
          if (onProgress && files.length % 100 === 0) {
            onProgress(files.length, relPath);
          }
        }
      }
    }
  }

  await walk(rootPath);

  return {
    files,
    totalScanned,
    skippedByIgnore,
    isLargeProject: totalScanned >= LARGE_PROJECT_WARNING_THRESHOLD,
  };
}

async function loadGitignorePatterns(
  rootPath: string,
): Promise<readonly GitignorePattern[]> {
  try {
    const content = await readFile(join(rootPath, ".gitignore"), "utf-8");
    return parseGitignore(content);
  } catch {
    return [];
  }
}
