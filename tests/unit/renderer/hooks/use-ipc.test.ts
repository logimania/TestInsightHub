import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIpc } from "../../../../src/renderer/hooks/use-ipc";
import { useUiStore } from "../../../../src/renderer/stores/ui-store";

// Mock window.api (not used directly by useIpc, but needed for store)
vi.stubGlobal("window", { api: {} });

describe("useIpc", () => {
  beforeEach(() => {
    useUiStore.setState({ logs: [] });
  });

  it("returns invoke function", () => {
    const { result } = renderHook(() => useIpc());
    expect(result.current.invoke).toBeDefined();
    expect(typeof result.current.invoke).toBe("function");
  });

  it("invoke returns result on success", async () => {
    const { result } = renderHook(() => useIpc());

    let value: string | null = null;
    await act(async () => {
      value = await result.current.invoke(() => Promise.resolve("hello"));
    });

    expect(value).toBe("hello");
  });

  it("invoke returns null on error and logs it", async () => {
    const { result } = renderHook(() => useIpc());

    let value: string | null = "not-null";
    await act(async () => {
      value = await result.current.invoke(() =>
        Promise.reject({ message: "failed", recoverable: false }),
      );
    });

    expect(value).toBeNull();
    const logs = useUiStore.getState().logs;
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe("error");
    expect(logs[0].message).toBe("failed");
  });

  it("logs warning for recoverable errors", async () => {
    const { result } = renderHook(() => useIpc());

    await act(async () => {
      await result.current.invoke(() =>
        Promise.reject({ message: "retry later", recoverable: true }),
      );
    });

    const logs = useUiStore.getState().logs;
    expect(logs[0].level).toBe("warning");
  });

  it("does not log when showErrorLog is false", async () => {
    const { result } = renderHook(() => useIpc({ showErrorLog: false }));

    await act(async () => {
      await result.current.invoke(() =>
        Promise.reject({ message: "silent error" }),
      );
    });

    expect(useUiStore.getState().logs.length).toBe(0);
  });
});
