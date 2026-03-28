import { useState, useEffect } from "react";
import { create } from "zustand";

interface ToastState {
  readonly message: string | null;
  readonly type: "success" | "error" | "info";
  readonly show: (message: string, type?: "success" | "error" | "info") => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  type: "success",
  show: (message, type = "success") => {
    set({ message, type });
    setTimeout(() => set({ message: null }), 3000);
  },
}));

export function Toast(): JSX.Element {
  const message = useToast((s) => s.message);
  const type = useToast((s) => s.type);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
    } else {
      // フェードアウト用に少し遅延
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!visible && !message) return <></>;

  return (
    <div
      className={`toast toast--${type} ${message ? "toast--show" : "toast--hide"}`}
    >
      <span className="toast-icon">
        {type === "success" ? "✓" : type === "error" ? "✗" : "ℹ"}
      </span>
      <span className="toast-message">{message}</span>
    </div>
  );
}
