import type {
  FileCoverage,
  CoverageReportFormat,
} from "@shared/types/coverage";
import type { PathMapping } from "@shared/types/settings";
import * as istanbul from "./parsers/istanbul-parser";
import * as lcov from "./parsers/lcov-parser";
import * as coveragepy from "./parsers/coveragepy-parser";
import * as goCover from "./parsers/go-cover-parser";
import * as llvmCov from "./parsers/llvm-cov-parser";

export function parseReport(
  content: string,
  format: CoverageReportFormat,
  rootPath: string,
): FileCoverage[] {
  switch (format) {
    case "istanbul":
      return istanbul.parse(content, rootPath);
    case "lcov":
      return lcov.parse(content, rootPath);
    case "coveragepy":
      return coveragepy.parse(content, rootPath);
    case "go-coverprofile":
      return goCover.parse(content, rootPath);
    case "llvm-cov":
      return llvmCov.parse(content, rootPath);
    default:
      return [];
  }
}

export function applyPathMappings(
  files: FileCoverage[],
  mappings: readonly PathMapping[],
): FileCoverage[] {
  if (mappings.length === 0) return files;

  return files.map((file) => {
    let mappedPath = file.filePath;
    for (const mapping of mappings) {
      if (mappedPath.startsWith(mapping.reportPrefix)) {
        mappedPath =
          mapping.sourcePrefix + mappedPath.slice(mapping.reportPrefix.length);
        break;
      }
    }
    return { ...file, filePath: mappedPath };
  });
}

export function matchWithSourceFiles(
  coverageFiles: FileCoverage[],
  sourceFilePaths: readonly string[],
): { matched: FileCoverage[]; unmatched: string[]; matchRate: number } {
  const sourceSet = new Set(sourceFilePaths);
  const matched: FileCoverage[] = [];
  const unmatched: string[] = [];

  for (const cf of coverageFiles) {
    if (sourceSet.has(cf.filePath)) {
      matched.push(cf);
    } else {
      unmatched.push(cf.filePath);
    }
  }

  const total = coverageFiles.length;
  const matchRate = total > 0 ? (matched.length / total) * 100 : 100;

  return { matched, unmatched, matchRate };
}
