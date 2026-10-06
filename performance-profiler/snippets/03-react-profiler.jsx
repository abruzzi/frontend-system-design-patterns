// Example 3 — React Profiler callback
//
// Idea: Performance API times *your logic*.
// Profiler times *React render / commit* for a subtree.
// Use this when the bottleneck might be in the UI, not analyzeLogs.

import { Profiler } from "react";

function onRender(id, phase, actualDuration, baseDuration) {
  // id             — Profiler id, e.g. "Results"
  // phase          — "mount" | "update"
  // actualDuration — time spent rendering this update
  // baseDuration   — estimated time without memoization
  console.log(
    `[React Profiler] ${id} ${phase}: ${actualDuration.toFixed(2)}ms` +
      ` (base ${baseDuration.toFixed(2)}ms)`
  );
}

function App({ logs }) {
  return (
    <Profiler id="Results" onRender={onRender}>
      <ResultsList logs={logs} />
    </Profiler>
  );
}
