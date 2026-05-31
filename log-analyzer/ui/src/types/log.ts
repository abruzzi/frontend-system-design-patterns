export type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  env: string;
  message: string;
  traceId: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  meta: {
    total: number;
    service: string | null;
    env: string | null;
    from: string | null;
    to: string | null;
    generatedAt: string;
  };
}

export type LevelFilter = "ALL" | LogLevel;

export type TimeRangePreset = "1h" | "4h" | "24h" | "7d" | "all";

export interface LogQuery {
  keyword: string;
  level: LevelFilter;
  fromMs: number;
  toMs: number;
  page: number;
  pageSize: number;
}

export interface TimelineBucket {
  startMs: number;
  endMs: number;
  count: number;
  byLevel: LogAggregations;
}

export interface LogAggregations {
  ERROR: number;
  WARN: number;
  INFO: number;
  DEBUG: number;
}

export interface AnalysisResult {
  requestId: number;
  filteredRows: LogEntry[];
  totalMatches: number;
  aggregations: LogAggregations;
  timeline: TimelineBucket[];
  durationMs: number;
}

export type ProcessingMode = "naive-main" | "debounced-main" | "worker";

export const PAGE_SIZE = 50;
export const DEBOUNCE_MS = 300;
