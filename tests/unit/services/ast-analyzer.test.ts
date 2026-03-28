import { describe, it, expect } from "vitest";
import { resolve } from "path";
import { analyzeFile } from "../../../src/main/services/project-parser/ast-analyzer";

const FIXTURE_PATH = resolve(__dirname, "../../fixtures/sample-project");
const MULTI_LANG_PATH = resolve(__dirname, "../../fixtures/multi-lang");

describe("ast-analyzer", () => {
  describe("TypeScript analysis", () => {
    it("analyzes a TypeScript file and extracts functions", async () => {
      const absPath = resolve(FIXTURE_PATH, "src/api/handler.ts");
      const result = await analyzeFile(
        absPath,
        "src/api/handler.ts",
        "typescript",
      );

      expect(result.path).toBe("src/api/handler.ts");
      expect(result.language).toBe("typescript");
      expect(result.loc).toBeGreaterThan(0);
      expect(result.functions.length).toBeGreaterThanOrEqual(2);

      const fnNames = result.functions.map((f) => f.name);
      expect(fnNames).toContain("handleGetUsers");
      expect(fnNames).toContain("handleHealthCheck");
    });

    it("extracts relative imports", async () => {
      const absPath = resolve(FIXTURE_PATH, "src/api/handler.ts");
      const result = await analyzeFile(
        absPath,
        "src/api/handler.ts",
        "typescript",
      );

      expect(result.imports.length).toBeGreaterThan(0);
      expect(result.imports).toContain("../service/user-service");
    });

    it("calculates complexity for functions with branches", async () => {
      const absPath = resolve(FIXTURE_PATH, "src/api/handler.ts");
      const result = await analyzeFile(
        absPath,
        "src/api/handler.ts",
        "typescript",
      );

      const handleGetUsers = result.functions.find(
        (f) => f.name === "handleGetUsers",
      );
      expect(handleGetUsers).toBeDefined();
      expect(handleGetUsers!.complexity).toBeGreaterThanOrEqual(2);
    });

    it("extracts functions from repo file", async () => {
      const absPath = resolve(FIXTURE_PATH, "src/repo/user-repo.ts");
      const result = await analyzeFile(
        absPath,
        "src/repo/user-repo.ts",
        "typescript",
      );

      const fnNames = result.functions.map((f) => f.name);
      expect(fnNames).toContain("findAllUsers");
      expect(fnNames).toContain("findUserById");
      expect(fnNames).toContain("createUser");
    });
  });

  describe("error handling", () => {
    it("returns empty result for non-existent files", async () => {
      const result = await analyzeFile(
        "/non/existent/file.ts",
        "non/existent/file.ts",
        "typescript",
      );

      expect(result.loc).toBe(0);
      expect(result.functions).toEqual([]);
      expect(result.imports).toEqual([]);
    });
  });

  describe("Python analysis", () => {
    it("extracts Python function definitions", async () => {
      const absPath = resolve(MULTI_LANG_PATH, "app.py");
      const result = await analyzeFile(absPath, "app.py", "python");

      const fnNames = result.functions.map((f) => f.name);
      expect(fnNames).toContain("greet");
      expect(fnNames).toContain("fetch_data");
      expect(fnNames).toContain("process");
      expect(result.loc).toBeGreaterThan(0);
    });

    it("extracts Python imports", async () => {
      const absPath = resolve(MULTI_LANG_PATH, "app.py");
      const result = await analyzeFile(absPath, "app.py", "python");

      expect(result.imports).toContain("os");
      expect(result.imports).toContain("pathlib");
      expect(result.imports).toContain("json");
      expect(result.imports).toContain("collections");
    });
  });

  describe("Go analysis", () => {
    it("extracts Go function definitions", async () => {
      const absPath = resolve(MULTI_LANG_PATH, "main.go");
      const result = await analyzeFile(absPath, "main.go", "go");

      const fnNames = result.functions.map((f) => f.name);
      expect(fnNames).toContain("main");
      expect(fnNames).toContain("handleRequest");
      expect(fnNames).toContain("calculateSum");
    });

    it("extracts Go imports", async () => {
      const absPath = resolve(MULTI_LANG_PATH, "main.go");
      const result = await analyzeFile(absPath, "main.go", "go");

      expect(result.imports).toContain("fmt");
      expect(result.imports).toContain("net/http");
    });
  });

  describe("Rust analysis", () => {
    it("extracts Rust function definitions", async () => {
      const absPath = resolve(MULTI_LANG_PATH, "lib.rs");
      const result = await analyzeFile(absPath, "lib.rs", "rust");

      const fnNames = result.functions.map((f) => f.name);
      expect(fnNames).toContain("greet");
      expect(fnNames).toContain("private_helper");
      expect(fnNames).toContain("fetch_data");
    });

    it("extracts Rust use imports", async () => {
      const absPath = resolve(MULTI_LANG_PATH, "lib.rs");
      const result = await analyzeFile(absPath, "lib.rs", "rust");

      expect(result.imports).toContain("std::io");
      expect(result.imports).toContain("std::collections::HashMap");
    });
  });

  describe("C++ analysis", () => {
    it("extracts C++ function definitions", async () => {
      const absPath = resolve(MULTI_LANG_PATH, "main.cpp");
      const result = await analyzeFile(absPath, "main.cpp", "cpp");

      const fnNames = result.functions.map((f) => f.name);
      expect(fnNames).toContain("calculateSum");
      expect(fnNames).toContain("processData");
      expect(fnNames).toContain("formatOutput");
    });

    it("extracts C++ #include imports", async () => {
      const absPath = resolve(MULTI_LANG_PATH, "main.cpp");
      const result = await analyzeFile(absPath, "main.cpp", "cpp");

      // Only quoted includes are extracted (not angle-bracket includes)
      expect(result.imports).toContain("utils.h");
      expect(result.imports).toContain("handler.h");
    });
  });
});
