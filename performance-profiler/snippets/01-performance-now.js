// Example 1 — measure the whole operation with performance.now()
//
// Idea: start a timer, run the work, subtract.
// You learn *how long* it took — not *which stage* is slow.

function analyzeLogs(logs, query) {
  // stubs for the teaching snippet
  const matched = searchLogs(logs, query.keyword);
  const filtered = filterLogs(matched, query);
  return aggregateLogs(filtered);
}

const start = performance.now();

const result = analyzeLogs(logs, query);

const duration = performance.now() - start;

console.log(`Log analysis took ${duration.toFixed(2)}ms`);
