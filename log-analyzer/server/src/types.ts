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
