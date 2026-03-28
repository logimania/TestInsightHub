import { useCallback } from "react";
import { useUiStore } from "../stores/ui-store";
import type { AppError } from "@shared/types/errors";

interface UseIpcOptions {
  readonly showErrorLog?: boolean;
}

export function useIpc(options: UseIpcOptions = {}) {
  const { showErrorLog = true } = options;
  const addLog = useUiStore((s) => s.addLog);

  const invoke = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        return await fn();
      } catch (error: unknown) {
        const appError = error as AppError;
        const message = appError?.message ?? "Unknown error occurred";
        if (showErrorLog) {
          addLog(appError?.recoverable ? "warning" : "error", message);
        }
        return null;
      }
    },
    [addLog, showErrorLog],
  );

  return { invoke };
}
