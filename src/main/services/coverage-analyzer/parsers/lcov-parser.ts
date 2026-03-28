import type {
  FileCoverage,
  CoverageMetric,
  LineRange,
} from "@shared/types/coverage";

export function canParse(content: string): boolean {
  return content.trimStart().startsWith("TN:") || content.includes("\nSF:");
}

export function parse(content: string, _rootPath: string): FileCoverage[] {
  const sections = splitSections(content);
  const results: FileCoverage[] = [];

  for (const section of sections) {
    const filePath = extractField(section, "SF:");
    if (!filePath) continue;

    const { lineData, branchData, fnData, fnDaData } = parseSection(section);

    const lineCoverage = computeMetric(lineData);
    const branchCoverage =
      branchData.length > 0 ? computeBranchMetric(branchData) : null;
    const functionCoverage = computeFnMetric(fnDaData);
    const uncoveredLines = findUncoveredLines(lineData, fnData);
    const uncoveredFunctions = findUncoveredFunctions(fnData, fnDaData);

    results.push({
      filePath: filePath.replace(/\\/g, "/"),
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

interface LineEntry {
  line: number;
  count: number;
}
interface BranchEntry {
  line: number;
  blockId: number;
  branchId: number;
  count: number;
}
interface FnEntry {
  name: string;
  startLine: number;
}
interface FnDaEntry {
  name: string;
  count: number;
}

function splitSections(content: string): string[] {
  return content.split(/end_of_record/i).filter((s) => s.trim());
}

function extractField(section: string, prefix: string): string | undefined {
  const match = new RegExp(`^${prefix.replace(":", "\\:")}(.+)$`, "m").exec(
    section,
  );
  return match?.[1]?.trim();
}

function parseSection(section: string) {
  const lines = section.split("\n");
  const lineData: LineEntry[] = [];
  const branchData: BranchEntry[] = [];
  const fnData: FnEntry[] = [];
  const fnDaData: FnDaEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DA:")) {
      const parts = trimmed.slice(3).split(",");
      if (parts.length >= 2) {
        lineData.push({
          line: parseInt(parts[0], 10),
          count: parseInt(parts[1], 10),
        });
      }
    } else if (trimmed.startsWith("BRDA:")) {
      const parts = trimmed.slice(5).split(",");
      if (parts.length >= 4) {
        branchData.push({
          line: parseInt(parts[0], 10),
          blockId: parseInt(parts[1], 10),
          branchId: parseInt(parts[2], 10),
          count: parts[3] === "-" ? 0 : parseInt(parts[3], 10),
        });
      }
    } else if (trimmed.startsWith("FN:")) {
      const parts = trimmed.slice(3).split(",");
      if (parts.length >= 2) {
        fnData.push({ startLine: parseInt(parts[0], 10), name: parts[1] });
      }
    } else if (trimmed.startsWith("FNDA:")) {
      const parts = trimmed.slice(5).split(",");
      if (parts.length >= 2) {
        fnDaData.push({ count: parseInt(parts[0], 10), name: parts[1] });
      }
    }
  }

  return { lineData, branchData, fnData, fnDaData };
}

function computeMetric(entries: LineEntry[]): CoverageMetric {
  const total = entries.length;
  const covered = entries.filter((e) => e.count > 0).length;
  return {
    covered,
    total,
    percentage: total > 0 ? (covered / total) * 100 : 0,
  };
}

function computeBranchMetric(entries: BranchEntry[]): CoverageMetric {
  const total = entries.length;
  const covered = entries.filter((e) => e.count > 0).length;
  return {
    covered,
    total,
    percentage: total > 0 ? (covered / total) * 100 : 0,
  };
}

function computeFnMetric(entries: FnDaEntry[]): CoverageMetric {
  const total = entries.length;
  const covered = entries.filter((e) => e.count > 0).length;
  return {
    covered,
    total,
    percentage: total > 0 ? (covered / total) * 100 : 0,
  };
}

function findUncoveredLines(
  lineData: LineEntry[],
  fnData: FnEntry[],
): LineRange[] {
  const uncovered: LineRange[] = [];
  for (const entry of lineData) {
    if (entry.count === 0) {
      const fn = fnData.find((f) => entry.line >= f.startLine);
      uncovered.push({
        start: entry.line,
        end: entry.line,
        functionName: fn?.name,
      });
    }
  }
  return mergeConsecutive(uncovered);
}

function findUncoveredFunctions(
  fnData: FnEntry[],
  fnDaData: FnDaEntry[],
): string[] {
  return fnDaData.filter((fd) => fd.count === 0).map((fd) => fd.name);
}

function mergeConsecutive(ranges: LineRange[]): LineRange[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: LineRange[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (
      sorted[i].start <= last.end + 1 &&
      sorted[i].functionName === last.functionName
    ) {
      merged[merged.length - 1] = { ...last, end: sorted[i].end };
    } else {
      merged.push(sorted[i]);
    }
  }
  return merged;
}
