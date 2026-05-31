import { bucketCountForSpan } from "./timeRange";
import type {
  AnalysisResult,
  LevelFilter,
  LogAggregations,
  LogEntry,
  LogQuery,
  TimelineBucket,
} from "../types/log";

function emptyByLevel(): LogAggregations {
  return { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };
}

function createTimeline(fromMs: number, toMs: number, bucketCount: number): TimelineBucket[] {
  const span = Math.max(toMs - fromMs, 1);
  const bucketSize = span / bucketCount;

  return Array.from({ length: bucketCount }, (_, index) => {
    const startMs = fromMs + index * bucketSize;
    const endMs = index === bucketCount - 1 ? toMs : fromMs + (index + 1) * bucketSize;
    return { startMs, endMs, count: 0, byLevel: emptyByLevel() };
  });
}

function bucketIndexForTimestamp(
  ts: number,
  fromMs: number,
  toMs: number,
  bucketCount: number
): number {
  const span = Math.max(toMs - fromMs, 1);
  const ratio = (ts - fromMs) / span;
  const index = Math.floor(ratio * bucketCount);
  return Math.min(Math.max(index, 0), bucketCount - 1);
}

export function analyzeLogs(
  sourceLogs: LogEntry[],
  query: LogQuery,
  requestId: number
): AnalysisResult {
  const start = performance.now();
  const keyword = query.keyword.trim().toLowerCase();
  const bucketCount = bucketCountForSpan(query.toMs - query.fromMs);
  const timeline = createTimeline(query.fromMs, query.toMs, bucketCount);

  const aggregations = emptyByLevel();
  const matchedLogs: LogEntry[] = [];

  for (let i = 0; i < sourceLogs.length; i++) {
    const log = sourceLogs[i]!;
    const ts = Date.parse(log.timestamp);

    if (ts < query.fromMs || ts > query.toMs) continue;

    const matchesLevel = query.level === "ALL" || log.level === query.level;
    const matchesKeyword =
      keyword.length === 0 || log.message.toLowerCase().includes(keyword);

    if (!matchesLevel || !matchesKeyword) continue;

    aggregations[log.level]++;
    matchedLogs.push(log);

    const bucket = timeline[bucketIndexForTimestamp(ts, query.fromMs, query.toMs, bucketCount)]!;
    bucket.count++;
    bucket.byLevel[log.level]++;
  }

  const totalMatches = matchedLogs.length;
  const startIndex = (query.page - 1) * query.pageSize;
  const endIndex = startIndex + query.pageSize;
  const filteredRows = matchedLogs.slice(startIndex, endIndex);

  return {
    requestId,
    filteredRows,
    totalMatches,
    aggregations,
    timeline,
    durationMs: performance.now() - start,
  };
}

export function simulateHeavyWork(iterations = 150_000): void {
  let acc = 0;
  for (let i = 0; i < iterations; i++) {
    acc += Math.sqrt(i % 97);
  }
  if (acc < 0) {
    console.log(acc);
  }
}

export function emptyAggregations(): LogAggregations {
  return emptyByLevel();
}

export function levelLabel(level: LevelFilter): string {
  return level === "ALL" ? "All levels" : level;
}
