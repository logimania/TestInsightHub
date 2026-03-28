import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import * as istanbul from "../../../src/main/services/coverage-analyzer/parsers/istanbul-parser";
import * as lcov from "../../../src/main/services/coverage-analyzer/parsers/lcov-parser";
import * as goCover from "../../../src/main/services/coverage-analyzer/parsers/go-cover-parser";

const FIXTURE_PATH = resolve(__dirname, "../../fixtures");

describe("Istanbul Parser", () => {
  const content = readFileSync(
    resolve(FIXTURE_PATH, "istanbul-report.json"),
    "utf-8",
  );

  it("detects Istanbul format", () => {
    expect(istanbul.canParse(content)).toBe(true);
  });

  it("parses coverage data for all files", () => {
    const files = istanbul.parse(content, "/project");
    expect(files.length).toBe(2);
  });

  it("calculates line coverage correctly", () => {
    const files = istanbul.parse(content, "/project");
    const handler = files.find((f) => f.filePath.includes("handler"));
    expect(handler).toBeDefined();
    expect(handler!.lineCoverage.total).toBe(4);
    expect(handler!.lineCoverage.covered).toBe(4);
    expect(handler!.lineCoverage.percentage).toBe(100);
  });

  it("detects uncovered functions", () => {
    const files = istanbul.parse(content, "/project");
    const repo = files.find((f) => f.filePath.includes("user-repo"));
    expect(repo).toBeDefined();
    expect(repo!.uncoveredFunctions).toContain("createUser");
  });

  it("calculates branch coverage", () => {
    const files = istanbul.parse(content, "/project");
    const handler = files.find((f) => f.filePath.includes("handler"));
    expect(handler!.branchCoverage).not.toBeNull();
    expect(handler!.branchCoverage!.total).toBe(2);
    expect(handler!.branchCoverage!.covered).toBe(2);
  });

  it("does not match non-Istanbul content", () => {
    expect(istanbul.canParse("not json")).toBe(false);
    expect(istanbul.canParse('{"key": "value"}')).toBe(false);
  });
});

describe("LCOV Parser", () => {
  const content = readFileSync(resolve(FIXTURE_PATH, "lcov.info"), "utf-8");

  it("detects LCOV format", () => {
    expect(lcov.canParse(content)).toBe(true);
  });

  it("parses coverage for all files", () => {
    const files = lcov.parse(content, "/project");
    expect(files.length).toBe(2);
  });

  it("calculates line coverage", () => {
    const files = lcov.parse(content, "/project");
    const handler = files.find((f) => f.filePath.includes("handler"));
    expect(handler).toBeDefined();
    expect(handler!.lineCoverage.total).toBe(6);
    expect(handler!.lineCoverage.covered).toBe(6);
  });

  it("detects uncovered functions", () => {
    const files = lcov.parse(content, "/project");
    const repo = files.find((f) => f.filePath.includes("user-repo"));
    expect(repo).toBeDefined();
    expect(repo!.uncoveredFunctions).toContain("createUser");
  });

  it("parses branch coverage", () => {
    const files = lcov.parse(content, "/project");
    const handler = files.find((f) => f.filePath.includes("handler"));
    expect(handler!.branchCoverage).not.toBeNull();
    expect(handler!.branchCoverage!.total).toBe(2);
  });

  it("finds uncovered lines in repo", () => {
    const files = lcov.parse(content, "/project");
    const repo = files.find((f) => f.filePath.includes("user-repo"));
    expect(repo!.uncoveredLines.length).toBeGreaterThan(0);
  });

  it("does not match non-LCOV content", () => {
    expect(lcov.canParse('{"json": true}')).toBe(false);
  });
});

describe("Go Coverprofile Parser", () => {
  const content = readFileSync(
    resolve(FIXTURE_PATH, "go-coverprofile.txt"),
    "utf-8",
  );

  it("detects Go coverprofile format", () => {
    expect(goCover.canParse(content)).toBe(true);
  });

  it("parses coverage for all files", () => {
    const files = goCover.parse(content, "/project");
    expect(files.length).toBe(2);
  });

  it("calculates correct coverage", () => {
    const files = goCover.parse(content, "/project");
    const handler = files.find((f) => f.filePath.includes("handler"));
    expect(handler).toBeDefined();
    expect(handler!.lineCoverage.covered).toBe(3);
    expect(handler!.lineCoverage.total).toBe(3);
  });

  it("detects uncovered blocks", () => {
    const files = goCover.parse(content, "/project");
    const repo = files.find((f) => f.filePath.includes("user_repo"));
    expect(repo).toBeDefined();
    expect(repo!.uncoveredLines.length).toBeGreaterThan(0);
  });

  it("branch coverage is null for Go", () => {
    const files = goCover.parse(content, "/project");
    expect(files[0].branchCoverage).toBeNull();
  });

  it("does not match non-Go content", () => {
    expect(goCover.canParse('{"json": true}')).toBe(false);
  });
});
