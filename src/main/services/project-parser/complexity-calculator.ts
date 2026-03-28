import type { Language } from "@shared/types/project";

/**
 * 循環的複雑度（Cyclomatic Complexity）を算出する。
 * 分岐ポイント数 + 1 で近似する。
 */
export function calculateComplexity(
  functionBody: string,
  language: Language,
): number {
  const patterns = getBranchPatterns(language);
  let complexity = 1;

  for (const pattern of patterns) {
    const matches = functionBody.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }

  return complexity;
}

function getBranchPatterns(language: Language): readonly RegExp[] {
  switch (language) {
    case "typescript":
    case "javascript":
      return [
        /\bif\s*\(/g,
        /\belse\s+if\s*\(/g,
        /\bfor\s*\(/g,
        /\bwhile\s*\(/g,
        /\bcase\s+/g,
        /\bcatch\s*\(/g,
        /\?\?/g,
        /\?\./g,
        /&&/g,
        /\|\|/g,
        /\?[^.?]/g,
      ];
    case "python":
      return [
        /\bif\s+/g,
        /\belif\s+/g,
        /\bfor\s+/g,
        /\bwhile\s+/g,
        /\bexcept\s*/g,
        /\band\b/g,
        /\bor\b/g,
      ];
    case "go":
      return [
        /\bif\s+/g,
        /\bfor\s+/g,
        /\bcase\s+/g,
        /\bselect\s*\{/g,
        /&&/g,
        /\|\|/g,
      ];
    case "rust":
      return [
        /\bif\s+/g,
        /\bfor\s+/g,
        /\bwhile\s+/g,
        /\bmatch\s+/g,
        /=>/g,
        /&&/g,
        /\|\|/g,
      ];
    case "c":
    case "cpp":
      return [
        /\bif\s*\(/g,
        /\bfor\s*\(/g,
        /\bwhile\s*\(/g,
        /\bcase\s+/g,
        /\bcatch\s*\(/g,
        /&&/g,
        /\|\|/g,
        /\?[^:]/g,
      ];
    default:
      return [];
  }
}

/**
 * LOC から簡易的に複雑度を推定する（AST 解析不能時のフォールバック）。
 */
export function estimateComplexityFromLoc(loc: number): number {
  return Math.min(Math.round(loc / 10), 100);
}
