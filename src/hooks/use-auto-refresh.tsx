/**
 * Auto-refresh hook for real-time dashboard updates
 * Polls data every 30 seconds
 */

import { useEffect, useRef } from "react";

interface UseAutoRefreshOptions {
  enabled?: boolean;
  interval?: number; // milliseconds, default 30000 (30 seconds)
  onRefresh: () => void | Promise<void>;
}

export function useAutoRefresh({
  enabled = true,
  interval = 30000,
  onRefresh,
}: UseAutoRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);

  // Keep onRefresh reference updated
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start polling
    intervalRef.current = setInterval(() => {
      onRefreshRef.current();
    }, interval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval]);

  // Manual refresh function
  const refresh = () => {
    onRefreshRef.current();
  };

  return { refresh };
}
