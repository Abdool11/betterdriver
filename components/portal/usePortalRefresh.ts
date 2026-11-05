"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Re-read authorised portal APIs on return; never mutate learner completion. */
export function usePortalRefresh(load: (signal: AbortSignal) => Promise<void>) {
  const [refreshing, setRefreshing] = useState(true);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    // Focus/visibility/pageshow may arrive together. One request batch is enough.
    if (controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setRefreshing(true);
    try {
      await load(controller.signal);
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        if (!controller.signal.aborted) setRefreshing(false);
      }
    }
  }, [load]);

  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    void refresh();
    window.addEventListener("focus", onReturn);
    window.addEventListener("pageshow", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      window.removeEventListener("focus", onReturn);
      window.removeEventListener("pageshow", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [refresh]);

  return { refresh, refreshing };
}
