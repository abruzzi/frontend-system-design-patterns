export type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG";

export interface LogEntry {
  id: string;
  level: LogLevel;
  service: string;
  message: string;
}

export interface LogQuery {
  keyword: string;
}

export interface LogAggregations {
  ERROR: number;
  WARN: number;
  INFO: number;
  DEBUG: number;
}

export interface AnalysisResult {
  filteredLogs: LogEntry[];
  aggregations: LogAggregations;
  durationMs: number;
}

export interface MeasureRow {
  name: string;
  duration: string;
}
