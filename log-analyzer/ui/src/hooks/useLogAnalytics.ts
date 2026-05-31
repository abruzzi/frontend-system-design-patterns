import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { analyzeLogs, emptyAggregations, simulateHeavyWork } from "../lib/analysis";
import { datasetAnchorMs, resolveTimeRange } from "../lib/timeRange";
import type {
  AnalysisResult,
  LevelFilter,
  LogEntry,
  LogsResponse,
  ProcessingMode,
  TimeRangePreset,
} from "../types/log";
import { DEBOUNCE_MS, PAGE_SIZE } from "../types/log";
import { useDebouncedValue } from "./useDebouncedValue";

interface UseLogAnalyticsOptions {
  mode: ProcessingMode;
}

interface UseLogAnalyticsReturn {
  logs: LogEntry[];
  meta: LogsResponse["meta"] | null;
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  keyword: string;
  level: LevelFilter;
  timeRange: TimeRangePreset;
  timeWindow: { fromMs: number; toMs: number };
  page: number;
  isProcessing: boolean;
  lastBlockDurationMs: number | null;
  setKeyword: (value: string) => void;
  setLevel: (value: LevelFilter) => void;
  setTimeRange: (value: TimeRangePreset) => void;
  setPage: (value: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
}

export function useLogAnalytics({
  mode,
}: UseLogAnalyticsOptions): UseLogAnalyticsReturn {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [meta, setMeta] = useState<LogsResponse["meta"] | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [level, setLevel] = useState<LevelFilter>("ALL");
  const [timeRange, setTimeRange] = useState<TimeRangePreset>("4h");
  const [page, setPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastBlockDurationMs, setLastBlockDurationMs] = useState<number | null>(
    null
  );
  const [workerReady, setWorkerReady] = useState(false);

  const logsRef = useRef<LogEntry[]>([]);
  const requestIdRef = useRef(0);
  const workerRef = useRef<Worker | null>(null);
  const latestRequestIdRef = useRef(0);

  const debouncedKeywordValue = useDebouncedValue(keyword, DEBOUNCE_MS);
  const debouncedLevelValue = useDebouncedValue(level, DEBOUNCE_MS);
  const debouncedPageValue = useDebouncedValue(page, DEBOUNCE_MS);
  const debouncedTimeRangeValue = useDebouncedValue(timeRange, DEBOUNCE_MS);

  const debouncedKeyword = mode === "naive-main" ? keyword : debouncedKeywordValue;
  const debouncedLevel = mode === "naive-main" ? level : debouncedLevelValue;
  const debouncedPage = mode === "naive-main" ? page : debouncedPageValue;
  const debouncedTimeRange = mode === "naive-main" ? timeRange : debouncedTimeRangeValue;

  const anchorMs = useMemo(() => datasetAnchorMs(logs), [logs]);
  const timeWindow = useMemo(
    () => resolveTimeRange(debouncedTimeRange, anchorMs, logs),
    [debouncedTimeRange, anchorMs, logs]
  );

  const runMainThreadAnalysis = useCallback(
    (sourceLogs: LogEntry[], requestId: number) => {
      const blockStart = performance.now();

      const analysis = analyzeLogs(
        sourceLogs,
        {
          keyword: debouncedKeyword,
          level: debouncedLevel,
          fromMs: timeWindow.fromMs,
          toMs: timeWindow.toMs,
          page: debouncedPage,
          pageSize: PAGE_SIZE,
        },
        requestId
      );

      simulateHeavyWork(600_000);

      const blockDuration = performance.now() - blockStart;
      setLastBlockDurationMs(blockDuration);
      setResult(analysis);
      setIsProcessing(false);
    },
    [debouncedKeyword, debouncedLevel, debouncedPage, timeWindow.fromMs, timeWindow.toMs]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("service")) params.set("service", "payment-service");
    if (!params.has("env")) params.set("env", "prod");

    const query = params.toString();
    if (window.location.search !== `?${query}`) {
      window.history.replaceState(null, "", `?${query}`);
    }

    setLoading(true);
    setError(null);

    fetch(`/api/logs?${query}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load logs (${res.status})`);
        return res.json() as Promise<LogsResponse>;
      })
      .then((data) => {
        logsRef.current = data.logs;
        setLogs(data.logs);
        setMeta(data.meta);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mode !== "worker") {
      setWorkerReady(false);
      return;
    }

    setWorkerReady(false);
    const worker = new Worker(
      new URL("../workers/analytics.worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as
        | { type: "INGESTED"; total: number }
        | { type: "RESULT"; result: AnalysisResult }
        | { type: "ERROR"; message: string };

      if (data.type === "INGESTED") {
        setWorkerReady(true);
      }

      if (data.type === "RESULT") {
        if (data.result.requestId !== latestRequestIdRef.current) return;
        setResult(data.result);
        setLastBlockDurationMs(data.result.durationMs);
        setIsProcessing(false);
      }

      if (data.type === "ERROR") {
        setError(data.message);
        setIsProcessing(false);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      setWorkerReady(false);
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "worker" || logs.length === 0 || !workerRef.current) return;
    workerRef.current.postMessage({ type: "INGEST", logs });
  }, [mode, logs]);

  useEffect(() => {
    if (logsRef.current.length === 0) return;
    if (mode === "worker" && !workerReady) return;

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    latestRequestIdRef.current = requestId;
    setIsProcessing(true);

    if (mode === "worker") {
      workerRef.current?.postMessage({
        type: "QUERY",
        requestId,
        query: {
          keyword: debouncedKeyword,
          level: debouncedLevel,
          fromMs: timeWindow.fromMs,
          toMs: timeWindow.toMs,
          page: debouncedPage,
          pageSize: PAGE_SIZE,
        },
      });
      return;
    }

    runMainThreadAnalysis(logsRef.current, requestId);
  }, [
    mode,
    workerReady,
    debouncedKeyword,
    debouncedLevel,
    debouncedPage,
    timeWindow.fromMs,
    timeWindow.toMs,
    logs.length,
    runMainThreadAnalysis,
  ]);

  useEffect(() => {
    setPage(1);
  }, [keyword, level, timeRange]);

  const totalPages = result ? Math.max(1, Math.ceil(result.totalMatches / PAGE_SIZE)) : 1;

  const goToNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  const goToPrevPage = () => setPage((p) => Math.max(1, p - 1));

  return {
    logs,
    meta,
    result,
    loading,
    error,
    keyword,
    level,
    timeRange,
    timeWindow,
    page,
    isProcessing,
    lastBlockDurationMs,
    setKeyword,
    setLevel,
    setTimeRange,
    setPage,
    goToNextPage,
    goToPrevPage,
  };
}

export function placeholderResult(): AnalysisResult {
  return {
    requestId: 0,
    filteredRows: [],
    totalMatches: 0,
    aggregations: emptyAggregations(),
    timeline: [],
    durationMs: 0,
  };
}
