/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readdir, stat, rm, mkdir } from "fs/promises";

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => "/mock/userData"),
  },
}));

vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
  return {
    ...actual,
    readdir: vi.fn(),
    stat: vi.fn(),
    rm: vi.fn(),
    mkdir: vi.fn(),
  };
});

const { getCacheStats, clearProjectCache, clearAllCache, formatBytes } =
  await import("../../../src/main/services/cache-manager");

const mockReaddir = vi.mocked(readdir);
const mockStat = vi.mocked(stat);
const mockRm = vi.mocked(rm);
const mockMkdir = vi.mocked(mkdir);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("formatBytes", () => {
  it('returns "0 B" for zero bytes', () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500.0 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1.0 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1.0 GB");
  });
});

describe("getCacheStats", () => {
  it("returns zero stats when projects dir does not exist", async () => {
    mockReaddir.mockRejectedValueOnce(new Error("ENOENT"));

    const result = await getCacheStats();

    expect(result).toEqual({
      totalSizeBytes: 0,
      fileCount: 0,
      projectCount: 0,
    });
  });

  it("counts projects and files correctly", async () => {
    // First readdir: list projects
    mockReaddir.mockResolvedValueOnce([
      { name: "proj1", isDirectory: () => true },
      { name: "somefile.txt", isDirectory: () => false },
      { name: "proj2", isDirectory: () => true },
    ] as any);

    // Second readdir: proj1/cache files
    mockReaddir.mockResolvedValueOnce(["a.json", "b.json"] as any);
    // Third readdir: proj2/cache files
    mockReaddir.mockResolvedValueOnce(["c.json"] as any);

    // stat calls for each file
    mockStat.mockResolvedValueOnce({ size: 100 } as any);
    mockStat.mockResolvedValueOnce({ size: 200 } as any);
    mockStat.mockResolvedValueOnce({ size: 300 } as any);

    const result = await getCacheStats();

    expect(result.projectCount).toBe(2);
    expect(result.fileCount).toBe(3);
    expect(result.totalSizeBytes).toBe(600);
  });

  it("handles missing cache directory for a project gracefully", async () => {
    mockReaddir.mockResolvedValueOnce([
      { name: "proj1", isDirectory: () => true },
    ] as any);
    // cache dir doesn't exist
    mockReaddir.mockRejectedValueOnce(new Error("ENOENT"));

    const result = await getCacheStats();

    expect(result.projectCount).toBe(1);
    expect(result.fileCount).toBe(0);
    expect(result.totalSizeBytes).toBe(0);
  });
});

describe("clearProjectCache", () => {
  it("removes and recreates cache directory", async () => {
    mockRm.mockResolvedValueOnce(undefined);
    mockMkdir.mockResolvedValueOnce(undefined as any);

    await clearProjectCache("proj1");

    expect(mockRm).toHaveBeenCalledWith(expect.stringContaining("proj1"), {
      recursive: true,
      force: true,
    });
    expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining("proj1"), {
      recursive: true,
    });
  });

  it("handles errors gracefully when directory does not exist", async () => {
    mockRm.mockRejectedValueOnce(new Error("ENOENT"));

    await expect(clearProjectCache("nonexistent")).resolves.toBeUndefined();
  });
});

describe("clearAllCache", () => {
  it("clears cache for all project directories", async () => {
    mockReaddir.mockResolvedValueOnce([
      { name: "proj1", isDirectory: () => true },
      { name: "proj2", isDirectory: () => true },
      { name: "file.txt", isDirectory: () => false },
    ] as any);

    mockRm.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined as any);

    await clearAllCache();

    // Should have called rm twice (once per project)
    expect(mockRm).toHaveBeenCalledTimes(2);
    expect(mockMkdir).toHaveBeenCalledTimes(2);
  });

  it("handles errors when base path does not exist", async () => {
    mockReaddir.mockRejectedValueOnce(new Error("ENOENT"));

    await expect(clearAllCache()).resolves.toBeUndefined();
  });
});
