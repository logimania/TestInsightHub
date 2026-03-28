import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockReadFile, mockAccess } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockAccess: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  default: { readFile: mockReadFile, access: mockAccess },
  readFile: mockReadFile,
  access: mockAccess,
}));

import { collectProjectTestEnvironment } from "../../../src/main/services/feedback-generator/env-collector";

describe("collectProjectTestEnvironment", () => {
  beforeEach(() => {
    mockReadFile.mockReset();
    mockAccess.mockReset();
  });

  it("reads package.json and detects vitest framework", async () => {
    mockReadFile.mockImplementation((filePath: string) => {
      if (filePath.includes("package.json")) {
        return Promise.resolve(
          JSON.stringify({
            dependencies: { react: "18.0.0" },
            devDependencies: { vitest: "1.0.0", jsdom: "24.0.0" },
          }),
        );
      }
      if (filePath.includes("vitest.config.ts")) {
        return Promise.resolve(
          "export default defineConfig({ test: { environment: 'jsdom' } })",
        );
      }
      return Promise.reject(new Error("not found"));
    });
    mockAccess.mockImplementation((filePath: string) => {
      if (filePath.includes("vitest.config.ts")) return Promise.resolve();
      return Promise.reject(new Error("not found"));
    });

    const env = await collectProjectTestEnvironment("/project");

    expect(env.installedPackages).toContain("vitest");
    expect(env.installedPackages).toContain("react");
    expect(env.installedPackages).toContain("jsdom");
    expect(env.testFramework).toBe("vitest");
    expect(env.testEnvironment).toBe("jsdom");
  });

  it("handles missing package.json gracefully", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));
    mockAccess.mockRejectedValue(new Error("ENOENT"));

    const env = await collectProjectTestEnvironment("/empty");

    expect(env.installedPackages).toEqual([]);
    expect(env.testFramework).toBeNull();
  });

  it("handles package.json without dependencies field", async () => {
    mockReadFile.mockImplementation((filePath: string) => {
      if (filePath.includes("package.json")) {
        return Promise.resolve(JSON.stringify({ name: "my-app" }));
      }
      return Promise.reject(new Error("not found"));
    });
    mockAccess.mockRejectedValue(new Error("not found"));

    const env = await collectProjectTestEnvironment("/minimal");

    expect(env.installedPackages).toEqual([]);
    expect(env.testFramework).toBeNull();
  });

  it("reads multiple config files when they exist", async () => {
    mockReadFile.mockImplementation((filePath: string) => {
      if (filePath.includes("package.json")) {
        return Promise.resolve(
          JSON.stringify({
            devDependencies: { jest: "29.0.0" },
          }),
        );
      }
      if (filePath.includes("jest.config.ts")) {
        return Promise.resolve("module.exports = { testEnvironment: 'jsdom' }");
      }
      return Promise.reject(new Error("not found"));
    });
    mockAccess.mockImplementation((filePath: string) => {
      if (filePath.includes("jest.config.ts")) return Promise.resolve();
      return Promise.reject(new Error("not found"));
    });

    const env = await collectProjectTestEnvironment("/jest-project");

    expect(env.testFramework).toBe("jest");
    expect(env.configFiles.length).toBe(1);
  });
});
