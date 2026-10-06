import type { LogEntry, LogLevel } from "../types/log";

const LEVELS: LogLevel[] = ["ERROR", "WARN", "INFO", "DEBUG"];
const SERVICES = ["api-gateway", "auth", "payments", "inventory", "search"];
const MESSAGES = [
  "Request completed successfully",
  "Connection pool exhausted, retrying",
  "Cache miss for product catalog",
  "Timeout waiting for upstream response",
  "Invalid JWT signature rejected",
  "Rate limit exceeded for client",
  "Database query took longer than expected",
  "Payment webhook received",
  "Inventory reservation failed",
  "Search index rebuild finished",
];

/** Synthetic in-memory dataset — no server needed. */
export function generateLogs(count = 20_000): LogEntry[] {
  const logs: LogEntry[] = new Array(count);

  for (let i = 0; i < count; i++) {
    logs[i] = {
      id: `log-${i}`,
      level: LEVELS[i % LEVELS.length]!,
      service: SERVICES[i % SERVICES.length]!,
      message: `${MESSAGES[i % MESSAGES.length]!} #${i}`,
    };
  }

  return logs;
}
