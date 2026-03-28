import { create } from "zustand";

export interface LogEntry {
  readonly id: string;
  readonly level: "info" | "warning" | "error";
  readonly message: string;
  readonly timestamp: string;
}

interface UiState {
  readonly theme: "light" | "dark";
  readonly locale: "ja" | "en";
  readonly isLogPanelOpen: boolean;
  readonly logs: readonly LogEntry[];
  readonly setTheme: (theme: "light" | "dark") => void;
  readonly setLocale: (locale: "ja" | "en") => void;
  readonly toggleLogPanel: () => void;
  readonly addLog: (level: LogEntry["level"], message: string) => void;
  readonly clearLogs: () => void;
}

let logIdCounter = 0;

export const useUiStore = create<UiState>((set) => ({
  theme: "light",
  locale: "ja",
  isLogPanelOpen: false,
  logs: [],

  setTheme: (theme) => {
    set({ theme });
  },

  setLocale: (locale) => {
    set({ locale });
  },

  toggleLogPanel: () => {
    set((state) => ({ isLogPanelOpen: !state.isLogPanelOpen }));
  },

  addLog: (level, message) => {
    const entry: LogEntry = {
      id: String(++logIdCounter),
      level,
      message,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ logs: [...state.logs, entry] }));
  },

  clearLogs: () => {
    set({ logs: [] });
  },
}));
