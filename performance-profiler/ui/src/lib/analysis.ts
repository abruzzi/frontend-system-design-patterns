import type {
  AnalysisResult,
  LogAggregations,
  LogEntry,
  LogQuery,
  MeasureRow,
} from "../types/log";

/**
 * Intentionally inefficient so `search` shows up as the slow stage
 * in `console.table` and the Chrome Performance flamechart.
 */
export function searchLogs(logs: LogEntry[], keyword: string): LogEntry[] {
  const needle = keyword.trim().toLowerCase();
  if (needle.length === 0) return logs;

  const matched: LogEntry[] = [];

  for (const log of logs) {
    const haystack = `${log.service} ${log.level} ${log.message}`.toLowerCase();
    let found = false;

    for (let i = 0; i <= haystack.length - needle.length; i++) {
      let matches = true;
      for (let j = 0; j < needle.length; j++) {
        if (haystack[i + j] !== needle[j]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        found = true;
        break;
      }
    }

    if (found) matched.push(log);
  }

  return matched;
}

export function filterLogs(logs: LogEntry[]): LogEntry[] {
  return logs;
}

export function aggregateLogs(logs: LogEntry[]): LogAggregations {
  const aggregations: LogAggregations = {
    ERROR: 0,
    WARN: 0,
    INFO: 0,
    DEBUG: 0,
  };

  for (const log of logs) {
    aggregations[log.level]++;
  }

  return aggregations;
}

/**
 * `performance.now()` for the whole op; `mark` / `measure` for named stages.
 * Check the browser console for the log + `console.table` output.
 */
export function analyzeLogs(logs: LogEntry[], query: LogQuery): AnalysisResult {
  performance.clearMarks();
  performance.clearMeasures();

  const start = performance.now();

  performance.mark("search-start");
  const matchedLogs = searchLogs(logs, query.keyword);
  performance.mark("search-end");
  performance.measure("search", "search-start", "search-end");

  performance.mark("filter-start");
  const filteredLogs = filterLogs(matchedLogs);
  performance.mark("filter-end");
  performance.measure("filter", "filter-start", "filter-end");

  performance.mark("aggregate-start");
  const aggregations = aggregateLogs(filteredLogs);
  performance.mark("aggregate-end");
  performance.measure("aggregate", "aggregate-start", "aggregate-end");

  const duration = performance.now() - start;
  console.log(`Log analysis took ${duration.toFixed(2)}ms`);

  console.table(
    performance.getEntriesByType("measure").map(({ name, duration: d }) => ({
      name,
      duration: `${d.toFixed(2)}ms`,
    }))
  );

  return {
    filteredLogs,
    aggregations,
    durationMs: duration,
  };
}

export function getMeasureRows(): MeasureRow[] {
  return performance.getEntriesByType("measure").map(({ name, duration }) => ({
    name,
    duration: `${duration.toFixed(2)}ms`,
  }));
}
