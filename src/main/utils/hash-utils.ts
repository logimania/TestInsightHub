import { createHash } from "crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function generateProjectId(absolutePath: string): string {
  return sha256(absolutePath);
}

export function generateCacheKey(
  filePath: string,
  fileSize: number,
  mtimeMs: number,
): string {
  return sha256(`${filePath}:${fileSize}:${mtimeMs}`);
}
