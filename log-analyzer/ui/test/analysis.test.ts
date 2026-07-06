import assert from "node:assert/strict";
import test from "node:test";

import { analyzeLogs } from "../src/lib/analysis.ts";
import type { AnalysisResult, LogEntry, LogQuery } from "../src/types/log.ts";

const logs: LogEntry[] = [
  {
    id: "log-001",
    timestamp: "2026-05-27T21:30:00.000Z",
    level: "ERROR",
    service: "payment-service",
    env: "prod",
    message: "PriceCalculator.applyDiscount: Cannot read properties of null",
    traceId: "trace-a",
  },
  {
    id: "log-002",
    timestamp: "2026-05-27T21:31:00.000Z",
    level: "INFO",
    service: "payment-service",
    env: "prod",
    message: "POST /api/checkout started",
    traceId: "trace-a",
  },
  {
    id: "log-003",
    timestamp: "2026-05-27T22:00:00.000Z",
    level: "ERROR",
    service: "inventory-service",
    env: "prod",
    message: "502 Bad Gateway from upstream inventory-api",
    traceId: "trace-b",
  },
];

const query: LogQuery = {
  keyword: "pricecalculator",
  level: "ERROR",
  fromMs: Date.parse("2026-05-27T21:00:00.000Z"),
  toMs: Date.parse("2026-05-27T23:00:00.000Z"),
  page: 1,
  pageSize: 50,
};

function stableResult(result: AnalysisResult): Omit<AnalysisResult, "durationMs" | "requestId"> {
  const { durationMs: _durationMs, requestId: _requestId, ...stable } = result;
  return stable;
}

test("analysis is deterministic across execution contexts", () => {
  const mainThreadResult = analyzeLogs(logs, query, 1);
  const workerEquivalentResult = analyzeLogs(logs, query, 2);

  assert.deepEqual(stableResult(mainThreadResult), stableResult(workerEquivalentResult));
  assert.equal(mainThreadResult.totalMatches, 1);
  assert.equal(mainThreadResult.filteredRows[0]?.id, "log-001");
});
