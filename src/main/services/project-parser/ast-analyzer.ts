import { readFile } from "fs/promises";
import type { Language, ParsedFile, FunctionInfo } from "@shared/types/project";
import { calculateComplexity } from "./complexity-calculator";

/**
 * AST 解析を行い ParsedFile を生成する。
 * Phase 2 初期実装: 正規表現ベースの軽量パーサー。
 * 将来的に web-tree-sitter に置き換え予定。
 */
export async function analyzeFile(
  absolutePath: string,
  relativePath: string,
  language: Language,
): Promise<ParsedFile> {
  let content: string;
  try {
    content = await readFile(absolutePath, "utf-8");
  } catch {
    return {
      path: relativePath,
      language,
      loc: 0,
      functions: [],
      imports: [],
    };
  }

  const lines = content.split("\n");
  const loc = lines.length;
  const functions = extractFunctions(content, language);
  const imports = extractImports(content, language);

  return { path: relativePath, language, loc, functions, imports };
}

function extractFunctions(
  content: string,
  language: Language,
): readonly FunctionInfo[] {
  const lines = content.split("\n");
  const functions: FunctionInfo[] = [];
  const patterns = getFunctionPatterns(language);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of patterns) {
      const match = pattern.exec(line);
      if (match) {
        const name = match[1];
        const startLine = i + 1;
        const endLine = findBlockEnd(lines, i, language);
        const body = lines.slice(i, endLine).join("\n");
        const complexity = calculateComplexity(body, language);
        functions.push({ name, startLine, endLine, complexity });
        break;
      }
    }
  }
  return functions;
}

function getFunctionPatterns(language: Language): readonly RegExp[] {
  switch (language) {
    case "typescript":
    case "javascript":
      return [
        /(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
        /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/,
        /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\s*\([^)]*\)\s*(?:=>|:)/,
        /^\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/,
      ];
    case "python":
      return [/^\s*def\s+(\w+)\s*\(/m, /^\s*async\s+def\s+(\w+)\s*\(/m];
    case "go":
      return [/^func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(/m];
    case "rust":
      return [/^\s*(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/m];
    case "c":
    case "cpp":
      return [/^(?:[\w:*&<>\s]+?)\s+(\w+)\s*\([^)]*\)\s*\{?\s*$/m];
    default:
      return [];
  }
}

function extractImports(
  content: string,
  language: Language,
): readonly string[] {
  const imports: string[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    let match: RegExpExecArray | null;

    switch (language) {
      case "typescript":
      case "javascript":
        match = /from\s+['"]([^'"]+)['"]/.exec(trimmed);
        if (!match) {
          match = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/.exec(trimmed);
        }
        if (match && isRelativeImport(match[1])) {
          imports.push(match[1]);
        }
        break;
      case "python":
        match = /^from\s+([\w.]+)\s+import/.exec(trimmed);
        if (!match) {
          match = /^import\s+([\w.]+)/.exec(trimmed);
        }
        if (match) {
          imports.push(match[1]);
        }
        break;
      case "go":
        match = /^\s*"([^"]+)"/.exec(trimmed);
        if (match) {
          imports.push(match[1]);
        }
        break;
      case "rust":
        match = /^use\s+([\w:]+)/.exec(trimmed);
        if (match) {
          imports.push(match[1]);
        }
        break;
      case "c":
      case "cpp":
        match = /^#include\s*"([^"]+)"/.exec(trimmed);
        if (match) {
          imports.push(match[1]);
        }
        break;
    }
  }

  return imports;
}

function isRelativeImport(importPath: string): boolean {
  return importPath.startsWith(".") || importPath.startsWith("/");
}

function findBlockEnd(
  lines: readonly string[],
  startIdx: number,
  language: Language,
): number {
  if (language === "python") {
    const indent = getIndentLevel(lines[startIdx]);
    for (let i = startIdx + 1; i < lines.length; i++) {
      const line = lines[i].trimEnd();
      if (line === "") continue;
      if (getIndentLevel(lines[i]) <= indent) {
        return i;
      }
    }
    return lines.length;
  }

  let braceCount = 0;
  let started = false;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === "{") {
        braceCount++;
        started = true;
      } else if (ch === "}") {
        braceCount--;
        if (started && braceCount === 0) {
          return i + 1;
        }
      }
    }
  }
  return Math.min(startIdx + 20, lines.length);
}

function getIndentLevel(line: string): number {
  const match = /^(\s*)/.exec(line);
  return match ? match[1].length : 0;
}
