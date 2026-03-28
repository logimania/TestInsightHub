import { create } from "zustand";

interface ProgressState {
  readonly isActive: boolean;
  readonly message: string;
  readonly percentage: number | null; // null = indeterminate
  readonly start: (message: string) => void;
  readonly update: (message: string, percentage?: number) => void;
  readonly finish: () => void;
}

export const useProgress = create<ProgressState>((set) => ({
  isActive: false,
  message: "",
  percentage: null,

  start: (message) => {
    set({ isActive: true, message, percentage: null });
  },

  update: (message, percentage) => {
    set({ isActive: true, message, percentage: percentage ?? null });
  },

  finish: () => {
    set({ isActive: false, message: "", percentage: null });
  },
}));

export function ProgressBarGlobal(): JSX.Element {
  const isActive = useProgress((s) => s.isActive);
  const message = useProgress((s) => s.message);
  const percentage = useProgress((s) => s.percentage);

  if (!isActive) return <></>;

  return (
    <div className="global-progress">
      <div className="global-progress-bar">
        {percentage !== null ? (
          <div
            className="global-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        ) : (
          <div className="global-progress-indeterminate" />
        )}
      </div>
      <span className="global-progress-message">{message}</span>
    </div>
  );
}
