import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "../../../../src/renderer/stores/ui-store";

describe("useUiStore", () => {
  beforeEach(() => {
    useUiStore.setState({
      theme: "light",
      locale: "ja",
      isLogPanelOpen: false,
      logs: [],
    });
  });

  it("has correct initial state", () => {
    const state = useUiStore.getState();
    expect(state.theme).toBe("light");
    expect(state.locale).toBe("ja");
    expect(state.isLogPanelOpen).toBe(false);
    expect(state.logs).toEqual([]);
  });

  describe("setTheme", () => {
    it("sets theme to dark", () => {
      useUiStore.getState().setTheme("dark");
      expect(useUiStore.getState().theme).toBe("dark");
    });

    it("sets theme to light", () => {
      useUiStore.getState().setTheme("dark");
      useUiStore.getState().setTheme("light");
      expect(useUiStore.getState().theme).toBe("light");
    });
  });

  describe("setLocale", () => {
    it("sets locale to en", () => {
      useUiStore.getState().setLocale("en");
      expect(useUiStore.getState().locale).toBe("en");
    });

    it("sets locale to ja", () => {
      useUiStore.getState().setLocale("en");
      useUiStore.getState().setLocale("ja");
      expect(useUiStore.getState().locale).toBe("ja");
    });
  });

  describe("toggleLogPanel", () => {
    it("toggles from closed to open", () => {
      useUiStore.getState().toggleLogPanel();
      expect(useUiStore.getState().isLogPanelOpen).toBe(true);
    });

    it("toggles from open to closed", () => {
      useUiStore.getState().toggleLogPanel();
      useUiStore.getState().toggleLogPanel();
      expect(useUiStore.getState().isLogPanelOpen).toBe(false);
    });
  });

  describe("addLog", () => {
    it("adds info log entry", () => {
      useUiStore.getState().addLog("info", "test message");
      const logs = useUiStore.getState().logs;
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe("info");
      expect(logs[0].message).toBe("test message");
      expect(logs[0].id).toBeDefined();
      expect(logs[0].timestamp).toBeDefined();
    });

    it("adds multiple logs", () => {
      useUiStore.getState().addLog("info", "msg1");
      useUiStore.getState().addLog("warning", "msg2");
      useUiStore.getState().addLog("error", "msg3");
      const logs = useUiStore.getState().logs;
      expect(logs.length).toBe(3);
      expect(logs[0].level).toBe("info");
      expect(logs[1].level).toBe("warning");
      expect(logs[2].level).toBe("error");
    });

    it("generates unique IDs for each log", () => {
      useUiStore.getState().addLog("info", "a");
      useUiStore.getState().addLog("info", "b");
      const logs = useUiStore.getState().logs;
      expect(logs[0].id).not.toBe(logs[1].id);
    });
  });

  describe("clearLogs", () => {
    it("removes all logs", () => {
      useUiStore.getState().addLog("info", "msg1");
      useUiStore.getState().addLog("error", "msg2");
      expect(useUiStore.getState().logs.length).toBe(2);

      useUiStore.getState().clearLogs();
      expect(useUiStore.getState().logs).toEqual([]);
    });
  });
});
