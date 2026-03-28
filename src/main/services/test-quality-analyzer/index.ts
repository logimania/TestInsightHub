import { readFile } from "fs/promises";
import type { Language } from "@shared/types/project";
import {
  getAssertionPatterns,
  MAX_POSSIBLE_SCORE,
  type AssertionCategory,
} from "./assertion-patterns";
import { isTestFile } from "../coverage-analyzer/test-classifier";
import { detectLanguage } from "../../utils/file-utils";

export type QualityLevel = "high" | "medium" | "low" | "unknown";

export interface TestCaseQuality {
  readonly testName: string;
  readonly score: number;
  readonly maxScore: number;
  readonly percentage: number;
  readonly level: QualityLevel;
  readonly foundCategories: readonly AssertionCategory[];
  readonly missingCategories: readonly AssertionCategory[];
  readonly suggestions: readonly string[];
}

export interface FileQuality {
  readonly filePath: string;
  readonly language: Language;
  readonly testCases: readonly TestCaseQuality[];
  readonly averageScore: number;
  readonly averagePercentage: number;
  readonly level: QualityLevel;
}

export interface ProjectQuality {
  readonly files: readonly FileQuality[];
  readonly overallScore: number;
  readonly overallPercentage: number;
  readonly level: QualityLevel;
  readonly totalTests: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
}

export async function analyzeTestQuality(
  testFilePaths: readonly string[],
  rootPath: string,
): Promise<ProjectQuality> {
  const files: FileQuality[] = [];

  for (const filePath of testFilePaths) {
    if (!isTestFile(filePath)) continue;

    const language = detectLanguage(filePath);
    if (!language) continue;

    try {
      const absolutePath = `${rootPath}/${filePath}`;
      const content = await readFile(absolutePath, "utf-8");
      const fileQuality = analyzeFileQuality(filePath, content, language);
      files.push(fileQuality);
    } catch {
      // Skip files that can't be read
    }
  }

  return aggregateProjectQuality(files);
}

export function analyzeFileQuality(
  filePath: string,
  content: string,
  language: Language,
): FileQuality {
  const testBlocks = extractTestBlocks(content, language);
  const patterns = getAssertionPatterns(language);

  const testCases: TestCaseQuality[] = testBlocks.map((block) => {
    const foundCategories: AssertionCategory[] = [];
    let score = 0;

    for (const check of patterns) {
      const matched = check.patterns.some((p) => p.test(block.body));
      if (matched) {
        if (!foundCategories.includes(check.category)) {
          foundCategories.push(check.category);
          score += check.score;
        }
      }
    }

    const allCategories: AssertionCategory[] = [
      "status",
      "body",
      "property",
      "type_format",
      "error_case",
      "boundary",
    ];
    const missingCategories = allCategories.filter(
      (c) => !foundCategories.includes(c),
    );

    const percentage =
      MAX_POSSIBLE_SCORE > 0 ? (score / MAX_POSSIBLE_SCORE) * 100 : 0;
    const level = determineQualityLevel(percentage);
    const suggestions = generateSuggestions(missingCategories, language);

    return {
      testName: block.name,
      score,
      maxScore: MAX_POSSIBLE_SCORE,
      percentage: Math.round(percentage * 10) / 10,
      level,
      foundCategories,
      missingCategories,
      suggestions,
    };
  });

  const avgScore =
    testCases.length > 0
      ? testCases.reduce((s, t) => s + t.score, 0) / testCases.length
      : 0;
  const avgPercentage =
    testCases.length > 0
      ? testCases.reduce((s, t) => s + t.percentage, 0) / testCases.length
      : 0;

  return {
    filePath,
    language,
    testCases,
    averageScore: Math.round(avgScore * 10) / 10,
    averagePercentage: Math.round(avgPercentage * 10) / 10,
    level: determineQualityLevel(avgPercentage),
  };
}

interface TestBlock {
  readonly name: string;
  readonly body: string;
}

function extractTestBlocks(
  content: string,
  language: Language,
): readonly TestBlock[] {
  const blocks: TestBlock[] = [];

  switch (language) {
    case "typescript":
    case "javascript": {
      const regex =
        /(?:test|it)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s*)?\(\s*\)\s*(?:=>)?\s*\{/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const name = match[1];
        const startIdx = match.index + match[0].length;
        const body = extractBraceBlock(content, startIdx);
        blocks.push({ name, body });
      }
      break;
    }
    case "python": {
      const regex = /def\s+(test_\w+)\s*\(/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const name = match[1];
        const startIdx = match.index;
        const body = extractIndentBlock(content, startIdx);
        blocks.push({ name, body });
      }
      break;
    }
    case "go": {
      const regex = /func\s+(Test\w+)\s*\(\s*t\s+\*testing\.T\s*\)\s*\{/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const name = match[1];
        const startIdx = match.index + match[0].length;
        const body = extractBraceBlock(content, startIdx);
        blocks.push({ name, body });
      }
      break;
    }
    default: {
      // Treat entire file as one block for unsupported languages
      blocks.push({ name: "file", body: content });
    }
  }

  return blocks;
}

function extractBraceBlock(content: string, startIdx: number): string {
  let depth = 1;
  let i = startIdx;
  while (i < content.length && depth > 0) {
    if (content[i] === "{") depth++;
    else if (content[i] === "}") depth--;
    i++;
  }
  return content.slice(startIdx, i);
}

function extractIndentBlock(content: string, startIdx: number): string {
  const lines = content.slice(startIdx).split("\n");
  if (lines.length <= 1) return lines[0] ?? "";

  const firstLine = lines[0];
  const baseIndent = firstLine.length - firstLine.trimStart().length;
  const blockLines = [firstLine];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      blockLines.push(line);
      continue;
    }
    const indent = line.length - line.trimStart().length;
    if (indent <= baseIndent) break;
    blockLines.push(line);
  }

  return blockLines.join("\n");
}

function determineQualityLevel(percentage: number): QualityLevel {
  if (percentage >= 70) return "high";
  if (percentage >= 40) return "medium";
  return "low";
}

const SUGGESTION_MAP: Record<AssertionCategory, Record<string, string>> = {
  status: {
    default: "レスポンスのステータスコードを検証してください",
  },
  body: {
    default: "レスポンスボディ/戻り値の内容を検証してください",
  },
  property: {
    default: "プロパティの存在・データ構造を検証してください",
  },
  type_format: {
    default: "値の型・形式・範囲を検証してください",
  },
  error_case: {
    default: "エラーケース（不正入力、404、例外等）のテストを追加してください",
  },
  boundary: {
    default:
      "複数パターンの入力値（境界値・パラメタライズ）でテストしてください",
  },
};

function generateSuggestions(
  missingCategories: readonly AssertionCategory[],
  _language: Language,
): readonly string[] {
  return missingCategories.map(
    (cat) => SUGGESTION_MAP[cat]?.default ?? `${cat} の検証を追加してください`,
  );
}

function aggregateProjectQuality(
  files: readonly FileQuality[],
): ProjectQuality {
  const allTests = files.flatMap((f) => f.testCases);
  const totalTests = allTests.length;
  const totalScore = allTests.reduce((s, t) => s + t.score, 0);
  const totalPercentage =
    totalTests > 0
      ? allTests.reduce((s, t) => s + t.percentage, 0) / totalTests
      : 0;

  return {
    files,
    overallScore: Math.round((totalScore / Math.max(totalTests, 1)) * 10) / 10,
    overallPercentage: Math.round(totalPercentage * 10) / 10,
    level: determineQualityLevel(totalPercentage),
    totalTests,
    highCount: allTests.filter((t) => t.level === "high").length,
    mediumCount: allTests.filter((t) => t.level === "medium").length,
    lowCount: allTests.filter((t) => t.level === "low").length,
  };
}
