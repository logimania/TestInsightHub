import type { ParsedFile, ModuleNode } from "@shared/types/project";
import { dirname } from "path";

/**
 * ParsedFile[] からモジュール（ディレクトリ単位）のツリーを構築する。
 */
export function buildModules(
  files: readonly ParsedFile[],
  maxDepth: number = 2,
): readonly ModuleNode[] {
  const dirMap = groupByDirectory(files, maxDepth);
  const modules: ModuleNode[] = [];

  for (const [dirPath, dirFiles] of dirMap) {
    const children = buildChildModules(dirFiles, dirPath, maxDepth + 1);
    const name = dirPath.split("/").pop() || dirPath;
    const functionCount = dirFiles.reduce(
      (sum, f) => sum + f.functions.length,
      0,
    );
    const totalLoc = dirFiles.reduce((sum, f) => sum + f.loc, 0);

    modules.push({
      id: dirPath,
      name,
      path: dirPath,
      files: dirFiles,
      fileCount: dirFiles.length,
      functionCount,
      totalLoc,
      children,
    });
  }

  return modules.sort((a, b) => a.id.localeCompare(b.id));
}

function groupByDirectory(
  files: readonly ParsedFile[],
  maxDepth: number,
): Map<string, ParsedFile[]> {
  const dirMap = new Map<string, ParsedFile[]>();

  for (const file of files) {
    const dir = dirname(file.path);
    const parts = dir.split("/");
    const moduleDir = parts.slice(0, maxDepth).join("/") || ".";

    if (!dirMap.has(moduleDir)) {
      dirMap.set(moduleDir, []);
    }
    dirMap.get(moduleDir)!.push(file);
  }

  return dirMap;
}

function buildChildModules(
  files: readonly ParsedFile[],
  parentPath: string,
  depth: number,
): readonly ModuleNode[] {
  const subDirs = new Map<string, ParsedFile[]>();

  for (const file of files) {
    const dir = dirname(file.path);
    const parts = dir.split("/");
    if (parts.length <= depth - 1) continue;

    const childDir = parts.slice(0, depth).join("/");
    if (childDir === parentPath) continue;

    if (!subDirs.has(childDir)) {
      subDirs.set(childDir, []);
    }
    subDirs.get(childDir)!.push(file);
  }

  const children: ModuleNode[] = [];
  for (const [dirPath, dirFiles] of subDirs) {
    const name = dirPath.split("/").pop() || dirPath;
    const functionCount = dirFiles.reduce(
      (sum, f) => sum + f.functions.length,
      0,
    );
    const totalLoc = dirFiles.reduce((sum, f) => sum + f.loc, 0);

    children.push({
      id: dirPath,
      name,
      path: dirPath,
      files: dirFiles,
      fileCount: dirFiles.length,
      functionCount,
      totalLoc,
      children: [],
    });
  }

  return children.sort((a, b) => a.id.localeCompare(b.id));
}
