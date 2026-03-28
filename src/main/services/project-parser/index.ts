import type { ProjectStructure, ParseError } from "@shared/types/project";
import { scanProject } from "./file-scanner";
import { analyzeFile } from "./ast-analyzer";
import { resolveDependencies } from "./dependency-resolver";
import { buildModules } from "./module-builder";

export interface ParseOptions {
  readonly rootPath: string;
  readonly excludePatterns?: readonly string[];
  readonly onProgress?: (current: number, total: number, file: string) => void;
}

export async function parseProject(
  options: ParseOptions,
): Promise<ProjectStructure> {
  const { rootPath, excludePatterns = [], onProgress } = options;

  const scanResult = await scanProject(
    rootPath,
    excludePatterns,
    (current, file) => onProgress?.(current, 0, file),
  );

  const totalFiles = scanResult.files.length;
  if (onProgress) onProgress(0, totalFiles, "");

  const parsedFiles = [];
  const parseErrors: ParseError[] = [];

  for (let i = 0; i < scanResult.files.length; i++) {
    const scanned = scanResult.files[i];
    try {
      const parsed = await analyzeFile(
        scanned.absolutePath,
        scanned.relativePath,
        scanned.language,
      );
      parsedFiles.push(parsed);
    } catch (err) {
      parseErrors.push({
        filePath: scanned.relativePath,
        message: err instanceof Error ? err.message : "Unknown parse error",
      });
    }

    if (onProgress && (i + 1) % 100 === 0) {
      onProgress(i + 1, totalFiles, scanned.relativePath);
    }
  }

  if (onProgress) onProgress(totalFiles, totalFiles, "");

  const modules = buildModules(parsedFiles);
  const edges = resolveDependencies(parsedFiles);
  const totalLoc = parsedFiles.reduce((sum, f) => sum + f.loc, 0);

  return {
    rootPath,
    modules,
    edges,
    totalFiles: parsedFiles.length,
    totalLoc,
    parsedAt: new Date().toISOString(),
    parseErrors,
  };
}
