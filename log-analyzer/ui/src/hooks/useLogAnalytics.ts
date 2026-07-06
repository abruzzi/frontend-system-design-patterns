import { useEffect, useRef, useState } from "react";

import { runMainThreadDemoAnalysis } from "../lib/analysis";
import type {
  AnalysisResult,
  LevelFilter,
  LogEntry,
  LogsResponse,
  ProcessingMode,
  TimeRangePreset,
} from "../types/log";
import { PAGE_SIZE } from "../types/log";
import { useAnalyticsWorker } from "./useAnalyticsWorker";
import { useLogDataset } from "./useLogDataset";
import { useLogFilters } from "./useLogFilters";

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
  const { logs, meta, loading, error, setError } = useLogDataset();
  const {
    keyword,
    level,
    timeRange,
    page,
    timeWindow,
    query,
    setKeyword,
    setLevel,
    setTimeRange,
    setPage,
  } = useLogFilters(logs);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastBlockDurationMs, setLastBlockDurationMs] = useState<number | null>(
    null
  );

  const requestIdRef = useRef(0);
  const useWorker = mode === "worker";

  const { ready: workerReady, query: workerQuery } = useAnalyticsWorker(
    useWorker,
    logs,
    {
      onResult: (analysis) => {
        setResult(analysis);
        setLastBlockDurationMs(analysis.durationMs);
        setIsProcessing(false);
      },
      onError: (message) => {
        setError(message);
        setIsProcessing(false);
      },
    }
  );

  useEffect(() => {
    if (logs.length === 0) return;
    if (useWorker && !workerReady) return;

    const requestId = ++requestIdRef.current;
    setIsProcessing(true);

    if (useWorker) {
      workerQuery(requestId, query);
      return;
    }

    const analysis = runMainThreadDemoAnalysis(logs, query, requestId);
    setResult(analysis);
    setLastBlockDurationMs(analysis.durationMs);
    setIsProcessing(false);
  }, [useWorker, workerReady, logs, query, workerQuery]);

  const totalPages = result
    ? Math.max(1, Math.ceil(result.totalMatches / PAGE_SIZE))
    : 1;

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
