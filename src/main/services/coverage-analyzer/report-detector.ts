import type { CoverageReportFormat } from "@shared/types/coverage";
import * as istanbul from "./parsers/istanbul-parser";
import * as lcov from "./parsers/lcov-parser";
import * as coveragepy from "./parsers/coveragepy-parser";
import * as goCover from "./parsers/go-cover-parser";
import * as llvmCov from "./parsers/llvm-cov-parser";

interface ParserCandidate {
  readonly format: CoverageReportFormat;
  readonly canParse: (content: string) => boolean;
}

const candidates: readonly ParserCandidate[] = [
  { format: "istanbul", canParse: istanbul.canParse },
  { format: "lcov", canParse: lcov.canParse },
  { format: "coveragepy", canParse: coveragepy.canParse },
  { format: "go-coverprofile", canParse: goCover.canParse },
  { format: "llvm-cov", canParse: llvmCov.canParse },
];

export function detectReportFormat(
  content: string,
): CoverageReportFormat | null {
  for (const candidate of candidates) {
    if (candidate.canParse(content)) {
      return candidate.format;
    }
  }
  return null;
}

export function detectByFilename(
  filename: string,
): CoverageReportFormat | null {
  const lower = filename.toLowerCase();
  if (lower === "coverage-final.json" || lower.includes("istanbul"))
    return "istanbul";
  if (lower === "lcov.info" || lower.endsWith(".lcov")) return "lcov";
  if (lower === "coverage.json" && !lower.includes("istanbul"))
    return "coveragepy";
  if (lower.includes("coverprofile") || lower.includes("cover.out"))
    return "go-coverprofile";
  if (lower.includes("llvm-cov") || lower.includes("cargo-llvm"))
    return "llvm-cov";
  return null;
}
