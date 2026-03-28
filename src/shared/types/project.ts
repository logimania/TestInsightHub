export interface ParsedFile {
  readonly path: string;
  readonly language: Language;
  readonly loc: number;
  readonly functions: readonly FunctionInfo[];
  readonly imports: readonly string[];
}

export interface FunctionInfo {
  readonly name: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly complexity: number;
}

export type Language =
  | "typescript"
  | "javascript"
  | "python"
  | "go"
  | "rust"
  | "c"
  | "cpp";

export const LANGUAGE_EXTENSIONS: Record<Language, readonly string[]> = {
  typescript: [".ts", ".tsx"],
  javascript: [".js", ".jsx"],
  python: [".py"],
  go: [".go"],
  rust: [".rs"],
  c: [".c", ".h"],
  cpp: [".cpp", ".hpp"],
};

export interface ModuleNode {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly files: readonly ParsedFile[];
  readonly fileCount: number;
  readonly functionCount: number;
  readonly totalLoc: number;
  readonly children: readonly ModuleNode[];
}

export interface DependencyEdge {
  readonly source: string;
  readonly target: string;
  readonly weight: number;
  readonly isCyclic: boolean;
}

export interface ProjectStructure {
  readonly rootPath: string;
  readonly modules: readonly ModuleNode[];
  readonly edges: readonly DependencyEdge[];
  readonly totalFiles: number;
  readonly totalLoc: number;
  readonly parsedAt: string;
  readonly parseErrors: readonly ParseError[];
}

export interface ParseError {
  readonly filePath: string;
  readonly message: string;
  readonly line?: number;
}
