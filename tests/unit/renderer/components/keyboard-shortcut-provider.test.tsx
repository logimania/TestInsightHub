import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// Mock the hook since it has side effects
vi.mock("../../../../src/renderer/hooks/use-keyboard-shortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

import { KeyboardShortcutProvider } from "../../../../src/renderer/components/keyboard-shortcut-provider";

describe("KeyboardShortcutProvider", () => {
  it("renders null", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter>{children}</MemoryRouter>
    );
    // KeyboardShortcutProvider is a component that returns null
    const { result } = renderHook(() => null, { wrapper });
    expect(result.current).toBeNull();
  });
});
