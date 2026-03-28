import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  detectReportFormat,
  detectByFilename,
} from "../../../src/main/services/coverage-analyzer/report-detector";

const FIXTURE_PATH = resolve(__dirname, "../../fixtures");

describe("detectReportFormat", () => {
  it("detects Istanbul JSON format", () => {
    const content = readFileSync(
      resolve(FIXTURE_PATH, "istanbul-report.json"),
      "utf-8",
    );
    expect(detectReportFormat(content)).toBe("istanbul");
  });

  it("detects LCOV format", () => {
    const content = readFileSync(resolve(FIXTURE_PATH, "lcov.info"), "utf-8");
    expect(detectReportFormat(content)).toBe("lcov");
  });

  it("detects Go coverprofile format", () => {
    const content = readFileSync(
      resolve(FIXTURE_PATH, "go-coverprofile.txt"),
      "utf-8",
    );
    expect(detectReportFormat(content)).toBe("go-coverprofile");
  });

  it("returns null for unknown format", () => {
    expect(detectReportFormat("random text content")).toBeNull();
    expect(detectReportFormat("")).toBeNull();
  });
});

describe("detectByFilename", () => {
  it("detects by common filenames", () => {
    expect(detectByFilename("coverage-final.json")).toBe("istanbul");
    expect(detectByFilename("lcov.info")).toBe("lcov");
    expect(detectByFilename("cover.out")).toBe("go-coverprofile");
  });

  it("returns null for unknown filenames", () => {
    expect(detectByFilename("data.csv")).toBeNull();
    expect(detectByFilename("report.xml")).toBeNull();
  });
});
