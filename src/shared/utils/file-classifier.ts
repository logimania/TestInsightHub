/**
 * ファイルの内容からファイル種別を判定し、テスト方法の指示を生成する。
 * 純粋関数。ファイルシステムへのアクセスなし。
 */

export type FileCategory =
  | "types-only"
  | "re-export-only"
  | "electron-entry"
  | null;

/**
 * ファイルの内容を解析し、ファイル種別を返す。
 * null の場合は通常のソースコード。
 */
export function classifyFile(content: string): FileCategory {
  if (isTypesOnly(content)) return "types-only";
  if (isReExportOnly(content)) return "re-export-only";
  if (isElectronEntry(content)) return "electron-entry";
  return null;
}

/**
 * ファイル種別に応じたテスト方法の指示を返す。
 * 通常のソースコード（null）の場合はundefinedを返す。
 */
export function getTestingNote(category: FileCategory): string | undefined {
  switch (category) {
    case "types-only":
      return "このファイルは型定義のみで構成されています。ランタイムコードがないため、v8カバレッジでは計測されません。型の正しさはTypeScriptコンパイラ（tsc --noEmit）で検証してください。";
    case "re-export-only":
      return "このファイルはimportした関数を呼び出すだけのエントリポイントです。呼び出し先の各関数が個別にテストされていれば品質は担保されます。このファイル自体の統合テストを追加する場合は、全関数が正しく呼ばれることを検証してください。";
    case "electron-entry":
      return "このファイルはElectronのメインプロセスエントリポイントです。app.whenReady()やBrowserWindow生成を含むため、vitestのjsdom環境ではテストできません。Playwright for Electron（@playwright/test + electron）を導入してE2Eテストで検証してください。";
    default:
      return undefined;
  }
}

/**
 * 型定義のみかどうか。
 */
function isTypesOnly(content: string): boolean {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !l.startsWith("//") &&
        !l.startsWith("*") &&
        !l.startsWith("/*"),
    );

  if (lines.length === 0) return true;

  return lines.every(
    (line) =>
      line.startsWith("import type ") ||
      line.startsWith("export type ") ||
      line.startsWith("export interface ") ||
      line.startsWith("readonly ") ||
      line.startsWith("}") ||
      line.startsWith("{") ||
      line.startsWith("|") ||
      line.startsWith("};") ||
      /^\s*\|/.test(line) ||
      /^\s*readonly\s/.test(line),
  );
}

/**
 * re-exportのみかどうか。
 */
function isReExportOnly(content: string): boolean {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !l.startsWith("//") &&
        !l.startsWith("*") &&
        !l.startsWith("/*"),
    );

  if (lines.length === 0) return false;

  const importLines = lines.filter((l) => l.startsWith("import "));
  const nonImportLines = lines.filter((l) => !l.startsWith("import "));

  if (importLines.length === 0) return false;

  const functionBodies = nonImportLines.filter(
    (l) =>
      !l.startsWith("export function") &&
      !l.startsWith("}") &&
      !l.startsWith("{") &&
      l !== "",
  );

  const importedNames =
    importLines
      .join(" ")
      .match(/import\s*(?:type\s*)?\{([^}]+)\}/g)
      ?.flatMap((m) =>
        m
          .replace(/import\s*(type\s*)?\{/, "")
          .replace("}", "")
          .split(",")
          .map((n) => n.trim()),
      ) ?? [];

  if (importedNames.length === 0) return false;

  return functionBodies.every((line) =>
    importedNames.some((name) => line.includes(name + "(")),
  );
}

/**
 * Electronエントリポイントかどうか。
 */
function isElectronEntry(content: string): boolean {
  return (
    content.includes("app.whenReady()") ||
    (content.includes('from "electron"') &&
      content.includes("BrowserWindow") &&
      content.includes("createWindow"))
  );
}
