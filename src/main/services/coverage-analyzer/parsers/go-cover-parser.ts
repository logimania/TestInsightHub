import type {
  FileCoverage,
  CoverageMetric,
  LineRange,
} from "@shared/types/coverage";

export function canParse(content: string): boolean {
  const firstLine = content.split("\n")[0]?.trim() ?? "";
  return firstLine.startsWith("mode:");
}

export function parse(content: string, _rootPath: string): FileCoverage[] {
  const lines = content.split("\n");
  const fileMap = new Map<
    string,
    { covered: number; total: number; uncovered: LineRange[] }
  >();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("mode:")) continue;

    const match = /^(.+?):(\d+)\.(\d+),(\d+)\.(\d+)\s+(\d+)\s+(\d+)$/.exec(
      trimmed,
    );
    if (!match) continue;

    const filePath = match[1];
    const startLine = parseInt(match[2], 10);
    const endLine = parseInt(match[4], 10);
    const stmtCount = parseInt(match[6], 10);
    const hitCount = parseInt(match[7], 10);

    if (!fileMap.has(filePath)) {
      fileMap.set(filePath, { covered: 0, total: 0, uncovered: [] });
    }
    const entry = fileMap.get(filePath)!;
    entry.total += stmtCount;
    if (hitCount > 0) {
      entry.covered += stmtCount;
    } else {
      entry.uncovered.push({ start: startLine, end: endLine });
    }
  }

  const results: FileCoverage[] = [];
  for (const [filePath, data] of fileMap) {
    const percentage = data.total > 0 ? (data.covered / data.total) * 100 : 0;
    const metric: CoverageMetric = {
      covered: data.covered,
      total: data.total,
      percentage,
    };

    results.push({
      filePath: filePath.replace(/\\/g, "/"),
      lineCoverage: metric,
      branchCoverage: null,
      functionCoverage: metric,
      uncoveredLines: data.uncovered,
      uncoveredFunctions: [],
      coveredByTests: [],
    });
  }

  return results;
}
