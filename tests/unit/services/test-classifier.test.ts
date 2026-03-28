import { describe, it, expect } from "vitest";
import {
  classifyTestType,
  isTestFile,
} from "../../../src/main/services/coverage-analyzer/test-classifier";

describe("classifyTestType", () => {
  it("classifies by directory name", () => {
    expect(classifyTestType("tests/unit/user.test.ts")).toBe("unit");
    expect(classifyTestType("tests/integration/api.test.ts")).toBe(
      "integration",
    );
    expect(classifyTestType("tests/e2e/login.test.ts")).toBe("e2e");
  });

  it("classifies by file name pattern", () => {
    expect(classifyTestType("src/user.unit.test.ts")).toBe("unit");
    expect(classifyTestType("src/api.integration.test.ts")).toBe("integration");
    expect(classifyTestType("src/flow.e2e.test.ts")).toBe("e2e");
  });

  it("defaults to unit", () => {
    expect(classifyTestType("tests/foo.test.ts")).toBe("unit");
    expect(classifyTestType("some/path/bar.spec.js")).toBe("unit");
  });

  it("is case-insensitive for directories", () => {
    expect(classifyTestType("tests/Unit/foo.test.ts")).toBe("unit");
    expect(classifyTestType("tests/E2E/bar.test.ts")).toBe("e2e");
  });

  it("recognizes plural and abbreviated directory names", () => {
    expect(classifyTestType("tests/units/foo.test.ts")).toBe("unit");
    expect(classifyTestType("tests/integrations/api.test.ts")).toBe(
      "integration",
    );
    expect(classifyTestType("tests/int/api.test.ts")).toBe("integration");
    expect(classifyTestType("tests/end-to-end/flow.test.ts")).toBe("e2e");
    expect(classifyTestType("tests/end2end/flow.test.ts")).toBe("e2e");
  });

  it("handles backslash path separators", () => {
    expect(classifyTestType("tests\\integration\\api.test.ts")).toBe(
      "integration",
    );
    expect(classifyTestType("tests\\e2e\\login.test.ts")).toBe("e2e");
  });

  it("classifies .int. file name pattern as integration", () => {
    expect(classifyTestType("src/api.int.test.ts")).toBe("integration");
  });

  it("handles files with no directory at all", () => {
    expect(classifyTestType("foo.test.ts")).toBe("unit");
  });
});

describe("isTestFile", () => {
  it("detects test files by pattern", () => {
    expect(isTestFile("foo.test.ts")).toBe(true);
    expect(isTestFile("bar.spec.tsx")).toBe(true);
    expect(isTestFile("test_baz.py")).toBe(true);
    expect(isTestFile("qux_test.go")).toBe(true);
  });

  it("detects test files by directory", () => {
    expect(isTestFile("tests/foo.ts")).toBe(true);
    expect(isTestFile("__tests__/bar.tsx")).toBe(true);
  });

  it("rejects non-test files", () => {
    expect(isTestFile("src/index.ts")).toBe(false);
    expect(isTestFile("lib/utils.py")).toBe(false);
    expect(isTestFile("main.go")).toBe(false);
  });

  it("detects Rust test files", () => {
    expect(isTestFile("src/handler_test.rs")).toBe(true);
  });

  it("detects Python _test files", () => {
    expect(isTestFile("src/handler_test.py")).toBe(true);
  });

  it("detects files in spec and specs directories", () => {
    expect(isTestFile("spec/foo.ts")).toBe(true);
    expect(isTestFile("specs/bar.ts")).toBe(true);
  });

  it("detects test files with .spec.js pattern", () => {
    expect(isTestFile("foo.spec.js")).toBe(true);
  });

  it("detects test files with .test.jsx pattern", () => {
    expect(isTestFile("component.test.jsx")).toBe(true);
  });

  it("detects test files with .spec.tsx pattern", () => {
    expect(isTestFile("component.spec.tsx")).toBe(true);
  });

  it("handles backslash path separators", () => {
    expect(isTestFile("tests\\unit\\foo.ts")).toBe(true);
    expect(isTestFile("__tests__\\bar.tsx")).toBe(true);
  });

  it("handles path with test directory in the middle", () => {
    expect(isTestFile("project/test/helpers/util.ts")).toBe(true);
  });
});
