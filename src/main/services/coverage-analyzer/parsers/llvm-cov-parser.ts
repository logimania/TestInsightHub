import type {
  FileCoverage,
  CoverageMetric,
  LineRange,
} from "@shared/types/coverage";

interface LlvmCovExport {
  readonly data: readonly {
    readonly files: readonly LlvmCovFile[];
  }[];
}

interface LlvmCovFile {
  readonly filename: string;
  readonly summary: {
    readonly lines: {
      readonly count: number;
      readonly covered: number;
      readonly percent: number;
    };
    readonly functions: {
      readonly count: number;
      readonly covered: number;
      readonly percent: number;
    };
    readonly branches?: {
      readonly count: number;
      readonly covered: number;
      readonly percent: number;
    };
  };
  readonly segments?: readonly [number, number, number, boolean, boolean][];
}

export function canParse(content: string): boolean {
  try {
    const data = JSON.parse(content);
    return "data" in data && Array.isArray(data.data) && data.data[0]?.files;
  } catch {
    return false;
  }
}

export function parse(content: string, _rootPath: string): FileCoverage[] {
  const report: LlvmCovExport = JSON.parse(content);
  const results: FileCoverage[] = [];

  for (const dataEntry of report.data) {
    for (const file of dataEntry.files) {
      const lineCoverage: CoverageMetric = {
        covered: file.summary.lines.covered,
        total: file.summary.lines.count,
        percentage: file.summary.lines.percent,
      };

      const functionCoverage: CoverageMetric = {
        covered: file.summary.functions.covered,
        total: file.summary.functions.count,
        percentage: file.summary.functions.percent,
      };

      let branchCoverage: CoverageMetric | null = null;
      if (file.summary.branches) {
        branchCoverage = {
          covered: file.summary.branches.covered,
          total: file.summary.branches.count,
          percentage: file.summary.branches.percent,
        };
      }

      const uncoveredLines: LineRange[] = [];
      if (file.segments) {
        for (const seg of file.segments) {
          const [line, _col, count, _hasCount, _isRegion] = seg;
          if (count === 0) {
            uncoveredLines.push({ start: line, end: line });
          }
        }
      }

      results.push({
        filePath: file.filename.replace(/\\/g, "/"),
        lineCoverage,
        branchCoverage,
        functionCoverage,
        uncoveredLines,
        uncoveredFunctions: [],
        coveredByTests: [],
      });
    }
  }

  return results;
}
