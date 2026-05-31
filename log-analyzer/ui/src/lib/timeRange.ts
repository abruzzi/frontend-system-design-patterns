import type { LogEntry, TimeRangePreset } from "../types/log";

export const TIME_RANGE_MS: Record<Exclude<TimeRangePreset, "all">, number> = {
  "1h": 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

export const TIME_RANGE_LABELS: Record<TimeRangePreset, string> = {
  "1h": "Last 1 hour",
  "4h": "Last 4 hours",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  all: "All time",
};

export const TIME_RANGE_PRESETS: TimeRangePreset[] = ["1h", "4h", "24h", "7d", "all"];

/** End of the demo incident window — Wed May 27, 2026 4:30pm PT */
const INCIDENT_ANCHOR_MS = Date.parse("2026-05-27T16:30:00-07:00");

export function datasetAnchorMs(logs: LogEntry[]): number {
  if (logs.length === 0) return INCIDENT_ANCHOR_MS;

  const hasIncident = logs.some((log) =>
    log.message.includes("PriceCalculator.applyDiscount")
  );
  if (hasIncident) return INCIDENT_ANCHOR_MS;

  let max = Number.NEGATIVE_INFINITY;
  for (const log of logs) {
    const ts = Date.parse(log.timestamp);
    if (ts > max) max = ts;
  }
  return max;
}

export function resolveTimeRange(
  preset: TimeRangePreset,
  anchorMs: number,
  logs: LogEntry[]
): { fromMs: number; toMs: number } {
  if (preset === "all") {
    if (logs.length === 0) {
      const now = Date.now();
      return { fromMs: now - TIME_RANGE_MS["24h"], toMs: now };
    }
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const log of logs) {
      const ts = Date.parse(log.timestamp);
      if (ts < min) min = ts;
      if (ts > max) max = ts;
    }
    return { fromMs: min, toMs: max };
  }

  const span = TIME_RANGE_MS[preset];
  return { fromMs: anchorMs - span, toMs: anchorMs };
}

export function bucketCountForSpan(spanMs: number): number {
  if (spanMs <= TIME_RANGE_MS["1h"]) return 30;
  if (spanMs <= TIME_RANGE_MS["4h"]) return 48;
  if (spanMs <= TIME_RANGE_MS["24h"]) return 48;
  return 56;
}

export function formatTimeAxis(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ts));
}
