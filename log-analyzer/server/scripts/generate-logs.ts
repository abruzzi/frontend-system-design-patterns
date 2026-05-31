import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { LogEntry, LogLevel } from "../src/types.js";

const SERVICES = [
  "auth-service",
  "payment-service",
  "inventory-service",
  "notification-service",
  "search-service",
] as const;

const ENVS = ["prod", "staging", "dev"] as const;

/** Wednesday May 27, 2026 — 2:30pm Pacific */
const INCIDENT_START = Date.parse("2026-05-27T14:30:00-07:00");
const ROLLOUT_DURATION_MS = 30 * 60 * 1000;
const ROLLOUT_STOPS_AT = INCIDENT_START + ROLLOUT_DURATION_MS + 8 * 60 * 1000;

/** Default UI window: Wed 2:00–4:30pm PT */
const INCIDENT_VIEW_START = Date.parse("2026-05-27T14:00:00-07:00");
const INCIDENT_VIEW_END = Date.parse("2026-05-27T16:30:00-07:00");

const WINDOW_START = Date.parse("2026-05-26T06:00:00-07:00");
const WINDOW_END = Date.parse("2026-05-28T20:00:00-07:00");

const INCIDENT_SERVICE = "payment-service";
const INCIDENT_ENV = "prod";

/** Same underlying failure on every affected request — discoverable by grouping. */
const INCIDENT_ERROR =
  "PriceCalculator.applyDiscount: Cannot read properties of null (reading 'tier')";

const BACKGROUND_ERROR_MESSAGES = [
  "Connection timeout after 30000ms to postgres-primary",
  "Failed to validate JWT: signature mismatch",
  "Rate limit exceeded for client 192.168.1.42",
  "502 Bad Gateway from upstream inventory-api",
  "Kafka consumer lag exceeded threshold (120s)",
];

const WARN_MESSAGES = [
  "Retry attempt 2/3 for external API call",
  "Cache miss rate above 40% in last 5 minutes",
  "Slow query detected: 842ms on user_lookup",
  "Memory usage at 78% on pod auth-service-7f9c2",
  "Request payload size 1.2MB exceeds recommended limit",
];

const INFO_MESSAGES = [
  "User login successful",
  "Order #48291 created",
  "Webhook delivered to partner endpoint",
  "Scheduled job completed: nightly-reconciliation",
  "Health check passed",
  "Cache warmed for product catalog",
  "Session refreshed for user",
  "Email notification queued",
];

const DEBUG_MESSAGES = [
  "SQL query: SELECT * FROM users WHERE id = $1",
  "Request headers sanitized",
  "GraphQL resolver cache hit",
  "Span started: payment.authorize",
];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomTraceId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

function randomFlagBucket(): number {
  return Math.floor(Math.random() * 10_000);
}

/** Stepped percentage rollout — simulation only, never logged as metadata. */
function rolloutPercentAt(ts: number): number {
  const elapsed = ts - INCIDENT_START;
  if (elapsed < 0) return 0;
  if (elapsed >= ROLLOUT_DURATION_MS) return 100;

  const steps = [
    { atMs: 0, pct: 1 },
    { atMs: 2 * 60_000, pct: 3 },
    { atMs: 5 * 60_000, pct: 8 },
    { atMs: 9 * 60_000, pct: 15 },
    { atMs: 14 * 60_000, pct: 28 },
    { atMs: 18 * 60_000, pct: 45 },
    { atMs: 22 * 60_000, pct: 62 },
    { atMs: 26 * 60_000, pct: 81 },
    { atMs: 29 * 60_000, pct: 94 },
    { atMs: ROLLOUT_DURATION_MS, pct: 100 },
  ];

  for (let i = steps.length - 1; i >= 0; i--) {
    if (elapsed >= steps[i]!.atMs) return steps[i]!.pct;
  }
  return 1;
}

function burstFactor(ts: number): number {
  const elapsed = ts - INCIDENT_START;
  if (elapsed < 0 || elapsed >= ROLLOUT_DURATION_MS) return 1;

  const minute = Math.floor(elapsed / 60_000);
  const stepSpike = [2, 5, 9, 14, 18, 22, 26, 29].includes(minute) ? 2.4 : 1;
  const organicNoise = 0.55 + Math.random() * 1.1;
  const microBurst = Math.random() < 0.08 ? 3.5 : 1;

  return stepSpike * organicNoise * microBurst;
}

function sampleTimestamp(): number {
  const roll = Math.random();

  if (roll < 0.42) {
    return INCIDENT_VIEW_START + Math.random() * (INCIDENT_VIEW_END - INCIDENT_VIEW_START);
  }

  if (roll < 0.72) {
    const dayOffset = Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000;
    const dayStart = WINDOW_START + dayOffset;
    const hour = 8 + Math.floor(Math.random() * 10);
    return dayStart + hour * 60 * 60 * 1000 + Math.random() * 60 * 60 * 1000;
  }

  return WINDOW_START + Math.random() * (WINDOW_END - WINDOW_START);
}

function messageForLevel(level: LogLevel, service: string, ts: number): string {
  if (level === "ERROR") return pick(BACKGROUND_ERROR_MESSAGES);
  if (level === "WARN") return pick(WARN_MESSAGES);
  if (level === "INFO") {
    if (service === INCIDENT_SERVICE && Math.random() < 0.12) {
      return "POST /api/checkout 200 142ms";
    }
    return pick(INFO_MESSAGES);
  }
  if (service === INCIDENT_SERVICE && ts >= ROLLOUT_STOPS_AT && Math.random() < 0.1) {
    return `feature_flag.evaluate name=checkout-v2 result=false bucket=${randomFlagBucket()}`;
  }
  return pick(DEBUG_MESSAGES);
}

function backgroundLevel(ts: number): LogLevel {
  const inIncidentView = ts >= INCIDENT_VIEW_START && ts <= INCIDENT_VIEW_END;
  const roll = Math.random();

  if (inIncidentView && ts >= ROLLOUT_STOPS_AT) {
    if (roll < 0.008) return "ERROR";
    if (roll < 0.04) return "WARN";
    if (roll < 0.5) return "INFO";
    return "DEBUG";
  }

  if (roll < 0.015) return "ERROR";
  if (roll < 0.07) return "WARN";
  if (roll < 0.42) return "INFO";
  return "DEBUG";
}

function pushLog(
  logs: LogEntry[],
  id: number,
  timestamp: string,
  entry: Omit<LogEntry, "id" | "timestamp">
): void {
  logs.push({
    id: `log-${String(id).padStart(6, "0")}`,
    timestamp,
    ...entry,
  });
}

/** Raw request span — no incident annotations, just app telemetry. */
function emitIncidentSpan(logs: LogEntry[], startId: number, ts: number): number {
  const traceId = randomTraceId();
  const bucket = randomFlagBucket();
  let id = startId;

  const span: Array<Omit<LogEntry, "id" | "timestamp">> = [
    {
      level: "DEBUG",
      service: INCIDENT_SERVICE,
      env: INCIDENT_ENV,
      message: `feature_flag.evaluate name=checkout-v2 result=true bucket=${bucket}`,
      traceId,
    },
    {
      level: "INFO",
      service: INCIDENT_SERVICE,
      env: INCIDENT_ENV,
      message: "POST /api/checkout started",
      traceId,
    },
    {
      level: "ERROR",
      service: INCIDENT_SERVICE,
      env: INCIDENT_ENV,
      message: INCIDENT_ERROR,
      traceId,
    },
  ];

  if (Math.random() < 0.35) {
    span.push({
      level: "WARN",
      service: INCIDENT_SERVICE,
      env: INCIDENT_ENV,
      message: "POST /api/checkout 500 89ms",
      traceId,
    });
  }

  for (let i = 0; i < span.length; i++) {
    const offset = i * (40 + Math.random() * 80);
    pushLog(logs, id++, new Date(ts + offset).toISOString(), span[i]!);
  }

  return id;
}

function emitBackgroundLog(logs: LogEntry[], id: number, ts: number): number {
  const level = backgroundLevel(ts);
  const service = pick(SERVICES);
  const env = level === "ERROR" && Math.random() < 0.7 ? "prod" : pick(ENVS);

  pushLog(logs, id, new Date(ts).toISOString(), {
    level,
    service,
    env,
    message: messageForLevel(level, service, ts),
    traceId: randomTraceId(),
  });

  return id + 1;
}

function incidentSpanProbability(ts: number): number {
  if (ts < INCIDENT_START || ts >= ROLLOUT_STOPS_AT) return 0;

  const rolloutPct = rolloutPercentAt(ts);
  const burst = burstFactor(ts);
  return (rolloutPct / 100) * burst * 0.28;
}

export function generateLogs(count: number): LogEntry[] {
  const timestamps: number[] = [];

  for (let i = 0; i < count; i++) {
    timestamps.push(sampleTimestamp());
  }

  timestamps.sort((a, b) => a - b);

  const logs: LogEntry[] = [];
  let id = 1;

  for (const ts of timestamps) {
    if (Math.random() < incidentSpanProbability(ts)) {
      id = emitIncidentSpan(logs, id, ts);
    } else {
      id = emitBackgroundLog(logs, id, ts);
    }
  }

  logs.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  logs.forEach((log, index) => {
    log.id = `log-${String(index + 1).padStart(6, "0")}`;
  });

  return logs.slice(0, count);
}

async function main(): Promise<void> {
  const count = Number(process.argv[2] ?? 50_000);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outputPath = path.resolve(__dirname, "../data/logs.json");

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const logs = generateLogs(count);
  await fs.writeFile(outputPath, JSON.stringify(logs));

  const stats = await fs.stat(outputPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  const incidentErrors = logs.filter((l) => l.message === INCIDENT_ERROR).length;

  process.stdout.write(
    `Generated ${logs.length.toLocaleString()} logs → ${outputPath} (${sizeMb} MB)\n` +
      `  ${incidentErrors.toLocaleString()} repeated PriceCalculator.applyDiscount errors in payment-service/prod\n`
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`generate-logs failed: ${message}\n`);
  process.exit(1);
});
