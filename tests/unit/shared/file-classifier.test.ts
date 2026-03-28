import { describe, it, expect } from "vitest";
import {
  classifyFile,
  getTestingNote,
} from "../../../src/shared/utils/file-classifier";

describe("classifyFile", () => {
  describe("types-only", () => {
    it("detects file with only interfaces and types", () => {
      const content = `
import type { TestType } from "./coverage";

export interface FeedbackFile {
  readonly version: string;
  readonly generatedAt: string;
}

export type Priority = "high" | "medium" | "low";
      `;
      expect(classifyFile(content)).toBe("types-only");
    });

    it("detects file with only export type", () => {
      const content = `
export type CoverageMode = "line" | "branch" | "function";
export type ColorLevel = "green" | "yellow" | "red" | "grey";
      `;
      expect(classifyFile(content)).toBe("types-only");
    });

    it("does not classify file with runtime code as types-only", () => {
      const content = `
export interface Config { threshold: number; }
export const DEFAULT_THRESHOLD = 80;
      `;
      expect(classifyFile(content)).not.toBe("types-only");
    });
  });

  describe("re-export-only", () => {
    it("detects file that only imports and calls imported functions", () => {
      const content = `
import { registerProjectHandlers } from "./project-handlers";
import { registerCoverageHandlers } from "./coverage-handlers";

export function registerAllHandlers(mainWindow) {
  registerProjectHandlers(mainWindow);
  registerCoverageHandlers();
}
      `;
      expect(classifyFile(content)).toBe("re-export-only");
    });

    it("does not classify file with own logic as re-export-only", () => {
      const content = `
import { parse } from "./parser";

export function process(input) {
  const result = parse(input);
  return result.map(x => x * 2);
}
      `;
      expect(classifyFile(content)).not.toBe("re-export-only");
    });
  });

  describe("electron-entry", () => {
    it("detects Electron entry point with app.whenReady()", () => {
      const content = `
import { app, BrowserWindow } from "electron";

function createWindow() {
  const win = new BrowserWindow({ width: 800, height: 600 });
}

app.whenReady().then(() => {
  createWindow();
});
      `;
      expect(classifyFile(content)).toBe("electron-entry");
    });

    it("does not classify regular Electron code as entry", () => {
      const content = `
import { ipcMain } from "electron";

export function registerHandlers() {
  ipcMain.handle("test", () => {});
}
      `;
      expect(classifyFile(content)).toBeNull();
    });
  });

  describe("testable files", () => {
    it("returns null for normal source files", () => {
      const content = `
export function add(a: number, b: number): number {
  return a + b;
}
      `;
      expect(classifyFile(content)).toBeNull();
    });

    it("returns null for React components", () => {
      const content = `
import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
      `;
      expect(classifyFile(content)).toBeNull();
    });

    it("returns null for zustand stores", () => {
      const content = `
import { create } from "zustand";

export const useStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));
      `;
      expect(classifyFile(content)).toBeNull();
    });
  });
});

describe("getTestingNote", () => {
  it("returns tsc advice for types-only", () => {
    const note = getTestingNote("types-only");
    expect(note).toContain("型定義のみ");
    expect(note).toContain("tsc");
  });

  it("returns integration test advice for re-export-only", () => {
    const note = getTestingNote("re-export-only");
    expect(note).toContain("エントリポイント");
    expect(note).toContain("個別にテスト");
  });

  it("returns Playwright advice for electron-entry", () => {
    const note = getTestingNote("electron-entry");
    expect(note).toContain("Playwright");
    expect(note).toContain("E2Eテスト");
  });

  it("returns undefined for normal files", () => {
    expect(getTestingNote(null)).toBeUndefined();
  });
});
