/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExecAsync = vi.fn();

vi.mock("child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("child_process")>();
  return {
    ...actual,
    exec: vi.fn(),
  };
});

vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
  return {
    ...actual,
    stat: vi.fn(),
  };
});

vi.mock("util", async (importOriginal) => {
  const actual = await importOriginal<typeof import("util")>();
  return {
    ...actual,
    promisify: vi.fn(() => mockExecAsync),
  };
});

const {
  isGitRepository,
  getFileCommitCount,
  getMaxCommitCount,
  getChangeFrequencyScore,
} = await import("../../../src/main/utils/git-utils");
import { stat } from "fs/promises";
import {
  CHANGE_FREQUENCY_DAYS,
  CHANGE_FREQUENCY_RECENT_DAYS,
  CHANGE_FREQUENCY_RECENT_SCORE,
} from "@shared/constants";

const mockStat = vi.mocked(stat);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isGitRepository", () => {
  it("returns true when git command succeeds", async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: "true", stderr: "" } as any);

    const result = await isGitRepository("/some/repo");

    expect(result).toBe(true);
    expect(mockExecAsync).toHaveBeenCalledWith(
      "git rev-parse --is-inside-work-tree",
      { cwd: "/some/repo" },
    );
  });

  it("returns false when git command fails", async () => {
    mockExecAsync.mockRejectedValueOnce(new Error("not a git repo"));

    const result = await isGitRepository("/not/a/repo");

    expect(result).toBe(false);
  });
});

describe("getFileCommitCount", () => {
  it("returns the number of commits for a file", async () => {
    mockExecAsync.mockResolvedValueOnce({
      stdout: "abc123\ndef456\nghi789\n",
      stderr: "",
    } as any);

    const result = await getFileCommitCount("/repo", "src/file.ts");

    expect(result).toBe(3);
  });

  it("returns 0 when there are no commits", async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: "", stderr: "" } as any);

    const result = await getFileCommitCount("/repo", "src/file.ts");

    expect(result).toBe(0);
  });

  it("returns 0 when git command fails", async () => {
    mockExecAsync.mockRejectedValueOnce(new Error("git error"));

    const result = await getFileCommitCount("/repo", "src/file.ts");

    expect(result).toBe(0);
  });

  it("uses provided days parameter", async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: "abc\n", stderr: "" } as any);

    await getFileCommitCount("/repo", "src/file.ts", 30);

    expect(mockExecAsync).toHaveBeenCalledWith(
      expect.stringContaining("30 days ago"),
      expect.any(Object),
    );
  });

  it("uses default days from constants", async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: "", stderr: "" } as any);

    await getFileCommitCount("/repo", "src/file.ts");

    expect(mockExecAsync).toHaveBeenCalledWith(
      expect.stringContaining(`${CHANGE_FREQUENCY_DAYS} days ago`),
      expect.any(Object),
    );
  });
});

describe("getMaxCommitCount", () => {
  it("returns the maximum commit count among files", async () => {
    mockExecAsync.mockResolvedValueOnce({
      stdout: "a\nb\n",
      stderr: "",
    } as any);
    mockExecAsync.mockResolvedValueOnce({
      stdout: "a\nb\nc\nd\n",
      stderr: "",
    } as any);
    mockExecAsync.mockResolvedValueOnce({ stdout: "a\n", stderr: "" } as any);

    const result = await getMaxCommitCount("/repo", [
      "f1.ts",
      "f2.ts",
      "f3.ts",
    ]);

    expect(result).toBe(4);
  });

  it("returns 1 as minimum when all files have 0 commits", async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: "", stderr: "" } as any);
    mockExecAsync.mockResolvedValueOnce({ stdout: "", stderr: "" } as any);

    const result = await getMaxCommitCount("/repo", ["f1.ts", "f2.ts"]);

    expect(result).toBe(1);
  });

  it("returns 1 for empty file list", async () => {
    const result = await getMaxCommitCount("/repo", []);

    expect(result).toBe(1);
  });
});

describe("getChangeFrequencyScore", () => {
  it("returns normalized score based on commit count for git repos", async () => {
    // 5 commits out of maxCount 10 => 50
    mockExecAsync.mockResolvedValueOnce({
      stdout: "a\nb\nc\nd\ne\n",
      stderr: "",
    } as any);

    const result = await getChangeFrequencyScore("/repo", "file.ts", 10, true);

    expect(result).toBe(50);
  });

  it("caps the score at 100", async () => {
    // 15 commits out of maxCount 10 => Math.min(150, 100) = 100
    const lines =
      Array.from({ length: 15 }, (_, i) => `hash${i}`).join("\n") + "\n";
    mockExecAsync.mockResolvedValueOnce({ stdout: lines, stderr: "" } as any);

    const result = await getChangeFrequencyScore("/repo", "file.ts", 10, true);

    expect(result).toBe(100);
  });

  it("returns 0 for git repos with no commits", async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: "", stderr: "" } as any);

    const result = await getChangeFrequencyScore("/repo", "file.ts", 10, true);

    expect(result).toBe(0);
  });

  it("returns CHANGE_FREQUENCY_RECENT_SCORE for recently modified non-git files", async () => {
    const recentMtime =
      Date.now() - (CHANGE_FREQUENCY_RECENT_DAYS - 1) * 24 * 60 * 60 * 1000;
    mockStat.mockResolvedValueOnce({ mtimeMs: recentMtime } as any);

    const result = await getChangeFrequencyScore(
      "/dir",
      "/dir/file.ts",
      10,
      false,
    );

    expect(result).toBe(CHANGE_FREQUENCY_RECENT_SCORE);
  });

  it("returns 0 for old non-git files", async () => {
    const oldMtime =
      Date.now() - (CHANGE_FREQUENCY_RECENT_DAYS + 10) * 24 * 60 * 60 * 1000;
    mockStat.mockResolvedValueOnce({ mtimeMs: oldMtime } as any);

    const result = await getChangeFrequencyScore(
      "/dir",
      "/dir/file.ts",
      10,
      false,
    );

    expect(result).toBe(0);
  });

  it("returns 0 when stat fails for non-git files", async () => {
    mockStat.mockRejectedValueOnce(new Error("ENOENT"));

    const result = await getChangeFrequencyScore(
      "/dir",
      "/dir/file.ts",
      10,
      false,
    );

    expect(result).toBe(0);
  });
});
