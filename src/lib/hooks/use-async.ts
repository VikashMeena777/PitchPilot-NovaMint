"use client";

import { useState, useCallback } from "react";

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

/**
 * Hook for handling async operations with loading/error states
 */
export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (asyncFn: () => Promise<T>): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await asyncFn();
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setState({ data: null, loading: false, error: message });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
