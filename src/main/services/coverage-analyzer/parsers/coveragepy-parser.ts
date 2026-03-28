import type {
  FileCoverage,
  CoverageMetric,
  LineRange,
} from "@shared/types/coverage";

interface CoveragePyFile {
  readonly executed_lines: readonly number[];
  readonly missing_lines: readonly number[];
  readonly excluded_lines?: readonly number[];
  readonly summary: {
    covered_lines: number;
    num_statements: number;
    percent_covered: number;
  };
  readonly executed_branches?: readonly [number, number][];
  readonly missing_branches?: readonly [number, number][];
}

interface CoveragePyReport {
  readonly files: Record<string, CoveragePyFile>;
}

export function canParse(content: string): boolean {
  try {
    const data = JSON.parse(content);
    return "files" in data && typeof data.files === "object";
  } catch {
    return false;
  }
}

export function parse(content: string, _rootPath: string): FileCoverage[] {
  const report: CoveragePyReport = JSON.parse(content);
  const results: FileCoverage[] = [];

  for (const [filePath, fileData] of Object.entries(report.files)) {
    const totalLines = fileData.summary.num_statements;
    const coveredLines = fileData.summary.covered_lines;

    const lineCoverage: CoverageMetric = {
      covered: coveredLines,
      total: totalLines,
      percentage: fileData.summary.percent_covered,
    };

    let branchCoverage: CoverageMetric | null = null;
    if (fileData.executed_branches || fileData.missing_branches) {
      const execCount = fileData.executed_branches?.length ?? 0;
      const missCount = fileData.missing_branches?.length ?? 0;
      const totalBranches = execCount + missCount;
      branchCoverage = {
        covered: execCount,
        total: totalBranches,
        percentage: totalBranches > 0 ? (execCount / totalBranches) * 100 : 0,
      };
    }

    const functionCoverage: CoverageMetric = {
      covered: coveredLines,
      total: totalLines,
      percentage: lineCoverage.percentage,
    };

    const uncoveredLines: LineRange[] = groupConsecutiveLines(
      fileData.missing_lines,
    );

    results.push({
      filePath: filePath.replace(/\\/g, "/"),
      lineCoverage,
      branchCoverage,
      functionCoverage,
      uncoveredLines,
      uncoveredFunctions: [],
      coveredByTests: [],
    });
  }

  return results;
}

function groupConsecutiveLines(lines: readonly number[]): LineRange[] {
  if (lines.length === 0) return [];
  const sorted = [...lines].sort((a, b) => a - b);
  const ranges: LineRange[] = [{ start: sorted[0], end: sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const last = ranges[ranges.length - 1];
    if (sorted[i] === last.end + 1) {
      ranges[ranges.length - 1] = { ...last, end: sorted[i] };
    } else {
      ranges.push({ start: sorted[i], end: sorted[i] });
    }
  }

  return ranges;
}
