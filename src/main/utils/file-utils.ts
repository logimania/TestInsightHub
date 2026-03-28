import { readFile, stat, readdir } from "fs/promises";
import { join, relative, extname, resolve } from "path";
import type { Dirent } from "fs";
import { EXCLUDED_DIRS } from "@shared/constants";
import type { Language } from "@shared/types/project";
import { LANGUAGE_EXTENSIONS } from "@shared/types/project";

export interface GitignorePattern {
  readonly pattern: string;
  readonly negated: boolean;
  readonly regex: RegExp;
}

export function parseGitignore(content: string): readonly GitignorePattern[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const negated = line.startsWith("!");
      const raw = negated ? line.slice(1) : line;
      const regex = gitignoreToRegex(raw);
      return { pattern: raw, negated, regex };
    });
}

function gitignoreToRegex(pattern: string): RegExp {
  let regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/\{\{GLOBSTAR\}\}/g, ".*");

  if (pattern.endsWith("/")) {
    regexStr = regexStr.slice(0, -2);
  }
  if (!pattern.startsWith("/")) {
    regexStr = `(^|/)${regexStr}`;
  }
  return new RegExp(`${regexStr}($|/)`, "i");
}

export function isIgnored(
  relativePath: string,
  patterns: readonly GitignorePattern[],
): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  let ignored = false;
  for (const p of patterns) {
    if (p.regex.test(normalized)) {
      ignored = !p.negated;
    }
  }
  return ignored;
}

export function detectLanguage(filePath: string): Language | null {
  const ext = extname(filePath).toLowerCase();
  for (const [lang, extensions] of Object.entries(LANGUAGE_EXTENSIONS)) {
    if ((extensions as readonly string[]).includes(ext)) {
      return lang as Language;
    }
  }
  return null;
}

export function isExcludedDir(dirName: string): boolean {
  return EXCLUDED_DIRS.includes(dirName);
}

export async function readTextFile(filePath: string): Promise<string> {
  return readFile(filePath, "utf-8");
}

export async function getFileStat(filePath: string) {
  return stat(filePath);
}

export async function listDirectory(
  dirPath: string,
): Promise<readonly Dirent[]> {
  return readdir(dirPath, { withFileTypes: true });
}

export function toRelativePath(rootPath: string, filePath: string): string {
  return relative(rootPath, filePath).replace(/\\/g, "/");
}

export function toAbsolutePath(rootPath: string, relativePath: string): string {
  return resolve(rootPath, relativePath);
}
