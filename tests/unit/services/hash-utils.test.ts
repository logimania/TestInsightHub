import { describe, it, expect } from "vitest";
import {
  sha256,
  generateProjectId,
  generateCacheKey,
} from "../../../src/main/utils/hash-utils";

describe("hash-utils", () => {
  describe("sha256", () => {
    it("returns a 64-character hex string", () => {
      const result = sha256("hello");
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    it("produces deterministic output for the same input", () => {
      expect(sha256("test")).toBe(sha256("test"));
    });

    it("produces different output for different inputs", () => {
      expect(sha256("abc")).not.toBe(sha256("def"));
    });

    it("handles empty string", () => {
      const result = sha256("");
      expect(result).toHaveLength(64);
      // Known SHA-256 of empty string
      expect(result).toBe(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      );
    });

    it("handles unicode input", () => {
      const result = sha256("日本語テスト");
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    it("handles very long input", () => {
      const longStr = "a".repeat(10000);
      const result = sha256(longStr);
      expect(result).toHaveLength(64);
    });
  });

  describe("generateProjectId", () => {
    it("generates a consistent ID from a path", () => {
      const id = generateProjectId("/home/user/project");
      expect(id).toHaveLength(64);
      expect(generateProjectId("/home/user/project")).toBe(id);
    });

    it("generates different IDs for different paths", () => {
      const id1 = generateProjectId("/project/a");
      const id2 = generateProjectId("/project/b");
      expect(id1).not.toBe(id2);
    });

    it("is equivalent to sha256 of the path", () => {
      const path = "/some/absolute/path";
      expect(generateProjectId(path)).toBe(sha256(path));
    });
  });

  describe("generateCacheKey", () => {
    it("generates a key from file path, size, and mtime", () => {
      const key = generateCacheKey("/src/index.ts", 1024, 1700000000000);
      expect(key).toHaveLength(64);
    });

    it("produces deterministic output for the same inputs", () => {
      const key1 = generateCacheKey("/src/index.ts", 1024, 1700000000000);
      const key2 = generateCacheKey("/src/index.ts", 1024, 1700000000000);
      expect(key1).toBe(key2);
    });

    it("changes when file path changes", () => {
      const key1 = generateCacheKey("/src/a.ts", 100, 1000);
      const key2 = generateCacheKey("/src/b.ts", 100, 1000);
      expect(key1).not.toBe(key2);
    });

    it("changes when file size changes", () => {
      const key1 = generateCacheKey("/src/a.ts", 100, 1000);
      const key2 = generateCacheKey("/src/a.ts", 200, 1000);
      expect(key1).not.toBe(key2);
    });

    it("changes when mtime changes", () => {
      const key1 = generateCacheKey("/src/a.ts", 100, 1000);
      const key2 = generateCacheKey("/src/a.ts", 100, 2000);
      expect(key1).not.toBe(key2);
    });

    it("is equivalent to sha256 of the composite string", () => {
      const key = generateCacheKey("/src/a.ts", 100, 999);
      expect(key).toBe(sha256("/src/a.ts:100:999"));
    });
  });
});
