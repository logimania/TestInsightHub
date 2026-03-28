import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useToast } from "../../../../src/renderer/components/toast";

describe("useToast store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToast.setState({ message: null, type: "success" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("has correct initial state", () => {
    const state = useToast.getState();
    expect(state.message).toBeNull();
    expect(state.type).toBe("success");
  });

  it("show sets message and type", () => {
    useToast.getState().show("Hello");
    expect(useToast.getState().message).toBe("Hello");
    expect(useToast.getState().type).toBe("success");
  });

  it("show with error type", () => {
    useToast.getState().show("Error!", "error");
    expect(useToast.getState().message).toBe("Error!");
    expect(useToast.getState().type).toBe("error");
  });

  it("show with info type", () => {
    useToast.getState().show("Info", "info");
    expect(useToast.getState().type).toBe("info");
  });

  it("auto-clears message after 3 seconds", () => {
    useToast.getState().show("Temporary");
    expect(useToast.getState().message).toBe("Temporary");

    vi.advanceTimersByTime(3000);
    expect(useToast.getState().message).toBeNull();
  });

  it("does not clear before 3 seconds", () => {
    useToast.getState().show("Temporary");
    vi.advanceTimersByTime(2999);
    expect(useToast.getState().message).toBe("Temporary");
  });
});
