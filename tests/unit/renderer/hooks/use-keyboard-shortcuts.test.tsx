import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import {
  useKeyboardShortcuts,
  SHORTCUT_LIST,
} from "../../../../src/renderer/hooks/use-keyboard-shortcuts";
import { useUiStore } from "../../../../src/renderer/stores/ui-store";

vi.stubGlobal("window", {
  ...window,
  api: {},
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    useUiStore.setState({ theme: "light", isLogPanelOpen: false });
  });

  it("registers keydown listener on mount", () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    expect(window.addEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
    );
  });

  it("removes keydown listener on unmount", () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(), { wrapper });
    unmount();
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
    );
  });
});

describe("SHORTCUT_LIST", () => {
  it("exports a list of keyboard shortcuts", () => {
    expect(SHORTCUT_LIST.length).toBe(7);
  });

  it("includes Ctrl+1 for home", () => {
    const home = SHORTCUT_LIST.find((s) => s.keys === "Ctrl+1");
    expect(home).toBeDefined();
    expect(home!.description).toBe("shortcuts.home");
  });

  it("includes Ctrl+L for log toggle", () => {
    const log = SHORTCUT_LIST.find((s) => s.keys === "Ctrl+L");
    expect(log).toBeDefined();
  });

  it("includes Ctrl+Shift+D for theme toggle", () => {
    const theme = SHORTCUT_LIST.find((s) => s.keys === "Ctrl+Shift+D");
    expect(theme).toBeDefined();
  });
});
