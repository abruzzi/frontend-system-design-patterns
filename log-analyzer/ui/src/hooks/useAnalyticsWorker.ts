import { useCallback, useEffect, useRef, useState } from "react";

import type { AnalysisResult, LogEntry, LogQuery } from "../types/log";

type WorkerOutbound =
  | { type: "INGESTED"; total: number }
  | { type: "RESULT"; result: AnalysisResult }
  | { type: "ERROR"; message: string };

export interface AnalyticsWorkerCallbacks {
  onResult: (result: AnalysisResult) => void;
  onError: (message: string) => void;
}

export function useAnalyticsWorker(
  enabled: boolean,
  logs: LogEntry[],
  callbacks: AnalyticsWorkerCallbacks
) {
  const [ready, setReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const latestRequestIdRef = useRef(0);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }

    setReady(false);
    const worker = new Worker(
      new URL("../workers/analytics.worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerOutbound>) => {
      const data = event.data;

      if (data.type === "INGESTED") {
        setReady(true);
        return;
      }

      if (data.type === "RESULT") {
        if (data.result.requestId !== latestRequestIdRef.current) return;
        callbacksRef.current.onResult(data.result);
        return;
      }

      if (data.type === "ERROR") {
        callbacksRef.current.onError(data.message);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      setReady(false);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || logs.length === 0 || !workerRef.current) return;
    workerRef.current.postMessage({ type: "INGEST", logs });
  }, [enabled, logs]);

  const query = useCallback((requestId: number, logQuery: LogQuery) => {
    latestRequestIdRef.current = requestId;
    workerRef.current?.postMessage({ type: "QUERY", requestId, query: logQuery });
  }, []);

  return { ready, query };
}
