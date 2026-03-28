import type {
  FileCoverage,
  CoverageMetric,
  LineRange,
} from "@shared/types/coverage";

interface IstanbulEntry {
  readonly path: string;
  readonly statementMap: Record<
    string,
    { start: { line: number }; end: { line: number } }
  >;
  readonly fnMap: Record<
    string,
    { name: string; decl: { start: { line: number }; end: { line: number } } }
  >;
  readonly branchMap: Record<
    string,
    { locations: { start: { line: number }; end: { line: number } }[] }
  >;
  readonly s: Record<string, number>;
  readonly f: Record<string, number>;
  readonly b: Record<string, number[]>;
}

export function canParse(content: string): boolean {
  try {
    const data = JSON.parse(content);
    const firstKey = Object.keys(data)[0];
    if (!firstKey) return false;
    const entry = data[firstKey];
    return "statementMap" in entry && "fnMap" in entry && "s" in entry;
  } catch {
    return false;
  }
}

export function parse(content: string, rootPath: string): FileCoverage[] {
  const data: Record<string, IstanbulEntry> = JSON.parse(content);
  const results: FileCoverage[] = [];

  for (const [filePath, entry] of Object.entries(data)) {
    const relativePath = normalizeFilePath(filePath, rootPath);

    const lineCoverage = computeLineCoverage(entry);
    const branchCoverage = computeBranchCoverage(entry);
    const functionCoverage = computeFunctionCoverage(entry);
    const uncoveredLines = findUncoveredLines(entry);
    const uncoveredFunctions = findUncoveredFunctions(entry);

    results.push({
      filePath: relativePath,
      lineCoverage,
      branchCoverage,
      functionCoverage,
      uncoveredLines,
      uncoveredFunctions,
      coveredByTests: [],
    });
  }

  return results;
}

function computeLineCoverage(entry: IstanbulEntry): CoverageMetric {
  const total = Object.keys(entry.s).length;
  const covered = Object.values(entry.s).filter((v) => v > 0).length;
  return {
    covered,
    total,
    percentage: total > 0 ? (covered / total) * 100 : 0,
  };
}

function computeBranchCoverage(entry: IstanbulEntry): CoverageMetric {
  let total = 0;
  let covered = 0;
  for (const branches of Object.values(entry.b)) {
    for (const count of branches) {
      total++;
      if (count > 0) covered++;
    }
  }
  return {
    covered,
    total,
    percentage: total > 0 ? (covered / total) * 100 : 0,
  };
}

function computeFunctionCoverage(entry: IstanbulEntry): CoverageMetric {
  const total = Object.keys(entry.f).length;
  const covered = Object.values(entry.f).filter((v) => v > 0).length;
  return {
    covered,
    total,
    percentage: total > 0 ? (covered / total) * 100 : 0,
  };
}

function findUncoveredLines(entry: IstanbulEntry): LineRange[] {
  const uncovered: LineRange[] = [];
  for (const [key, count] of Object.entries(entry.s)) {
    if (count === 0) {
      const stmt = entry.statementMap[key];
      if (stmt) {
        const fnName = findFunctionForLine(entry, stmt.start.line);
        uncovered.push({
          start: stmt.start.line,
          end: stmt.end.line,
          functionName: fnName,
        });
      }
    }
  }
  return mergeLineRanges(uncovered);
}

function findUncoveredFunctions(entry: IstanbulEntry): string[] {
  const uncovered: string[] = [];
  for (const [key, count] of Object.entries(entry.f)) {
    if (count === 0) {
      const fn = entry.fnMap[key];
      if (fn) uncovered.push(fn.name);
    }
  }
  return uncovered;
}

function findFunctionForLine(
  entry: IstanbulEntry,
  line: number,
): string | undefined {
  for (const fn of Object.values(entry.fnMap)) {
    if (line >= fn.decl.start.line && line <= fn.decl.end.line) {
      return fn.name;
    }
  }
  return undefined;
}

function mergeLineRanges(ranges: LineRange[]): LineRange[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: LineRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (
      sorted[i].start <= last.end + 1 &&
      sorted[i].functionName === last.functionName
    ) {
      merged[merged.length - 1] = {
        ...last,
        end: Math.max(last.end, sorted[i].end),
      };
    } else {
      merged.push(sorted[i]);
    }
  }
  return merged;
}

function normalizeFilePath(filePath: string, rootPath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const rootNormalized = rootPath.replace(/\\/g, "/");
  if (normalized.startsWith(rootNormalized)) {
    const rel = normalized.slice(rootNormalized.length);
    return rel.startsWith("/") ? rel.slice(1) : rel;
  }
  return normalized;
}
