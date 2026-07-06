import { useEffect, useState } from "react";

import type { LogEntry, LogsResponse } from "../types/log";

export function useLogDataset() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [meta, setMeta] = useState<LogsResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);

    fetch("/api/logs", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load logs (${res.status})`);
        return res.json() as Promise<LogsResponse>;
      })
      .then((data) => {
        if (!active) return;
        setLogs(data.logs);
        setMeta(data.meta);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!active) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return { logs, meta, loading, error, setError };
}
