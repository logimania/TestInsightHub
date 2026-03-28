import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "../stores/ui-store";

interface ShortcutDef {
  readonly key: string;
  readonly ctrl?: boolean;
  readonly shift?: boolean;
  readonly action: () => void;
  readonly description: string;
}

export function useKeyboardShortcuts(): void {
  const navigate = useNavigate();
  const setTheme = useUiStore((s) => s.setTheme);
  const theme = useUiStore((s) => s.theme);
  const toggleLogPanel = useUiStore((s) => s.toggleLogPanel);

  useEffect(() => {
    const shortcuts: ShortcutDef[] = [
      {
        key: "1",
        ctrl: true,
        action: () => navigate("/"),
        description: "Go to Home",
      },
      {
        key: "2",
        ctrl: true,
        action: () => navigate("/diagram"),
        description: "Go to Diagram",
      },
      {
        key: "3",
        ctrl: true,
        action: () => navigate("/coverage"),
        description: "Go to Coverage",
      },
      {
        key: "4",
        ctrl: true,
        action: () => navigate("/feedback"),
        description: "Go to Feedback",
      },
      {
        key: ",",
        ctrl: true,
        action: () => navigate("/settings"),
        description: "Go to Settings",
      },
      {
        key: "l",
        ctrl: true,
        action: () => toggleLogPanel(),
        description: "Toggle Log Panel",
      },
      {
        key: "d",
        ctrl: true,
        shift: true,
        action: () => setTheme(theme === "light" ? "dark" : "light"),
        description: "Toggle Theme",
      },
    ];

    const handleKeyDown = (e: KeyboardEvent): void => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

        if (e.key === shortcut.key && ctrlMatch && shiftMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, setTheme, theme, toggleLogPanel]);
}

export const SHORTCUT_LIST = [
  { keys: "Ctrl+1", description: "shortcuts.home" },
  { keys: "Ctrl+2", description: "shortcuts.diagram" },
  { keys: "Ctrl+3", description: "shortcuts.coverage" },
  { keys: "Ctrl+4", description: "shortcuts.feedback" },
  { keys: "Ctrl+,", description: "shortcuts.settings" },
  { keys: "Ctrl+L", description: "shortcuts.toggleLog" },
  { keys: "Ctrl+Shift+D", description: "shortcuts.toggleTheme" },
] as const;
