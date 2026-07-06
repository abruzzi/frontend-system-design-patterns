# Web Workers Video Script

This script explains the core idea behind the demo: a Web Worker does not make expensive JavaScript computation disappear, but it moves that computation away from the browser's UI thread so rendering, animation, and input can stay responsive.

---

## 1. Opening

In this demo, we have a mini log analyzer.

The server gives the browser 50,000 log entries. After that first fetch, the browser does the expensive work itself:

- search by keyword
- filter by level and time range
- aggregate counts by log level
- build a timeline chart
- paginate the matching rows

The important part is that the same analysis can run in two places:

- on the main thread
- inside a Web Worker

The calculation is the same. The data is the same. The difference is which thread does the work.

That difference is what makes the UI feel frozen in one mode and smooth in the other.

---

## 2. The Main Thread Problem

Browser apps usually run JavaScript on the main thread.

The main thread is responsible for a lot of visible work:

- React state updates and rendering
- handling clicks and keyboard input
- running `requestAnimationFrame`
- painting animations like the spinner
- executing our JavaScript loops

So if we run a big synchronous function on the main thread, the browser cannot update the UI until that function returns.

In the demo, we exaggerate that problem with a deliberate CPU burn:

```ts
// ui/src/lib/analysis.ts
export const DEMO_HEAVY_WORK_MIN_MS = 400;

export function simulateHeavyWork(minMs = DEMO_HEAVY_WORK_MIN_MS): void {
  const start = performance.now();
  let acc = 0;
  let i = 0;

  while (performance.now() - start < minMs) {
    for (let j = 0; j < 80_000; j++) {
      acc += Math.sqrt((i + j) % 97);
    }
    i += 80_000;
  }

  if (Number.isNaN(acc)) {
    throw new Error("Unexpected demo work result");
  }
}
```

This is intentionally artificial. It makes the freeze obvious on camera.

When this function runs on the main thread:

- the spinner stops
- FPS drops
- clicks and input wait
- React cannot update until the loop finishes

When the same function runs in a worker, the work still takes time, but the main thread can keep animating.

---

## 3. How FPS Is Calculated

To prove whether the UI is responsive, the demo uses an FPS meter.

The hook is built with `requestAnimationFrame`:

```ts
// ui/src/hooks/useFps.ts
export function useFps(): FpsSample {
  const [fps, setFps] = useState<FpsSample>({ avg: 60, min: 60 });
  const frameCount = useRef(0);
  const lastSample = useRef(performance.now());
  const lastFrame = useRef(performance.now());
  const maxFrameMs = useRef(0);

  useEffect(() => {
    let rafId = 0;

    const tick = (now: number) => {
      const frameMs = now - lastFrame.current;
      lastFrame.current = now;

      if (frameMs > 0) {
        maxFrameMs.current = Math.max(maxFrameMs.current, frameMs);
      }

      frameCount.current += 1;
      const elapsed = now - lastSample.current;

      if (elapsed >= 500) {
        const avg = Math.round((frameCount.current * 1000) / elapsed);
        const min =
          maxFrameMs.current === 0
            ? avg
            : Math.max(1, Math.round(1000 / maxFrameMs.current));

        setFps({ avg, min });
        frameCount.current = 0;
        lastSample.current = now;
        maxFrameMs.current = 0;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}
```

### Why `requestAnimationFrame`?

`requestAnimationFrame` runs right before the browser wants to paint the next frame.

That makes it a good signal for UI responsiveness. If the main thread is free, the browser can call our `tick` function around 60 times per second. If the main thread is blocked by a long JavaScript task, `requestAnimationFrame` cannot run.

So we are not measuring theoretical CPU speed. We are measuring whether the UI thread is getting regular chances to render.

### Average FPS

Every time `tick` runs, we increment `frameCount`.

Every 500ms, we calculate:

```ts
const avg = Math.round((frameCount * 1000) / elapsedMs);
```

If about 30 frames happen in 500ms:

```txt
(30 * 1000) / 500 = 60 fps
```

If the main thread is blocked and only 5 frames happen in 500ms:

```txt
(5 * 1000) / 500 = 10 fps
```

### Minimum FPS

Average FPS is useful, but it can hide one very bad stall.

So the hook also tracks the longest gap between two animation frames:

```ts
const frameMs = now - lastFrame.current;
maxFrameMs.current = Math.max(maxFrameMs.current, frameMs);
```

Then we convert that worst frame duration into an FPS-like number:

```ts
const min = Math.max(1, Math.round(1000 / maxFrameMs.current));
```

If the worst frame gap is 16ms:

```txt
1000 / 16 = about 60 fps
```

If one JavaScript task blocks the main thread for 400ms:

```txt
1000 / 400 = about 2.5 fps
```

That is why the min FPS drops so dramatically in main-thread mode. A single long task creates one terrible frame.

### Narration

When recording, point to the FPS meter and say:

> The average tells us how many frames are getting through over the last half second. The minimum tells us the worst frame gap. When the main thread blocks, `requestAnimationFrame` cannot run, so both numbers reveal the freeze.

---

## 4. The Shared Calculation

The key architectural choice is that the actual log analysis lives in one reusable function.

```ts
// ui/src/lib/analysis.ts
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

    const bucket =
      timeline[bucketIndexForTimestamp(ts, query.fromMs, query.toMs, bucketCount)]!;
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
```

This function does not know whether it is running on the main thread or in a worker.

That is the point.

It is just pure computation over logs and a query object. Because it does not touch React state or the DOM, we can call it from either execution context.

The demo wraps it in two named functions:

```ts
// ui/src/lib/analysis.ts
function runDemoAnalysis(
  logs: LogEntry[],
  query: LogQuery,
  requestId: number
): AnalysisResult {
  const blockStart = performance.now();
  const analysis = analyzeLogs(logs, query, requestId);
  simulateHeavyWork();
  analysis.durationMs = performance.now() - blockStart;
  return analysis;
}

export function runMainThreadDemoAnalysis(
  logs: LogEntry[],
  query: LogQuery,
  requestId: number
): AnalysisResult {
  return runDemoAnalysis(logs, query, requestId);
}

export function runWorkerDemoAnalysis(
  logs: LogEntry[],
  query: LogQuery,
  requestId: number
): AnalysisResult {
  return runDemoAnalysis(logs, query, requestId);
}
```

The wrappers are intentionally named for the video:

- `runMainThreadDemoAnalysis` means: run this synchronously in the UI thread
- `runWorkerDemoAnalysis` means: run this inside the worker

Same implementation. Different thread.

### Narration

> This is the pattern I want to highlight. We do not fork the business logic. We keep one shared calculation, and then decide where to execute it. That makes the worker an execution detail, not a second copy of the algorithm.

---

## 5. A Minimal Worker Setup

A worker is a separate JavaScript execution context.

It cannot access the DOM. It cannot directly set React state. It communicates with the main thread by sending messages.

Here is the worker in this demo:

```ts
// ui/src/workers/analytics.worker.ts
import { runWorkerDemoAnalysis } from "../lib/analysis";
import type { AnalysisResult, LogEntry, LogQuery } from "../types/log";

type WorkerInbound =
  | { type: "INGEST"; logs: LogEntry[] }
  | { type: "QUERY"; requestId: number; query: LogQuery };

type WorkerOutbound =
  | { type: "INGESTED"; total: number }
  | { type: "RESULT"; result: AnalysisResult }
  | { type: "ERROR"; message: string };

let sourceLogs: LogEntry[] = [];

self.onmessage = (event: MessageEvent<WorkerInbound>) => {
  const message = event.data;

  try {
    if (message.type === "INGEST") {
      sourceLogs = message.logs;
      self.postMessage({ type: "INGESTED", total: sourceLogs.length });
      return;
    }

    if (message.type === "QUERY") {
      const result = runWorkerDemoAnalysis(
        sourceLogs,
        message.query,
        message.requestId
      );
      self.postMessage({ type: "RESULT", result });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    self.postMessage({ type: "ERROR", message: msg });
  }
};

export {};
```

There are two message types going in:

- `INGEST`: copy the logs into worker memory
- `QUERY`: run analysis against the latest query

And three message types coming back:

- `INGESTED`: worker is ready
- `RESULT`: analysis finished
- `ERROR`: something failed

### Why ingest logs once?

Posting 50,000 objects to a worker has a cost because data crosses a thread boundary.

So instead of sending the full dataset on every search, the main thread sends it once:

```ts
workerRef.current.postMessage({ type: "INGEST", logs });
```

Then each search only sends a small query object:

```ts
workerRef.current?.postMessage({
  type: "QUERY",
  requestId,
  query: logQuery,
});
```

The worker sends back only what the UI needs:

- `filteredRows`: 50 rows for the current page
- `totalMatches`
- `aggregations`
- `timeline`
- `durationMs`

That keeps the worker boundary efficient.

### Narration

> The worker is not a magical faster version of JavaScript. There is still message passing overhead. The trick is to send the large dataset once, then send small queries, and return only the small result the UI needs.

---

## 6. Creating And Managing The Worker In React

The React hook owns the worker lifecycle.

```ts
// ui/src/hooks/useAnalyticsWorker.ts
const worker = new Worker(
  new URL("../workers/analytics.worker.ts", import.meta.url),
  { type: "module" }
);
workerRef.current = worker;
```

This Vite syntax lets the bundler build the worker as a separate module.

The hook also listens for worker messages:

```ts
worker.onmessage = (event: MessageEvent<WorkerOutbound>) => {
  const data = event.data;

  if (data.type === "INGESTED") {
    setReady(true);
    return;
  }

  if (data.type === "RESULT") {
    if (data.result.requestId !== latestRequestIdRef.current) return;
    callbacksRef.current.onResult(data.result);
    return;
  }

  if (data.type === "ERROR") {
    callbacksRef.current.onError(data.message);
  }
};
```

And it terminates the worker during cleanup:

```ts
return () => {
  worker.terminate();
  workerRef.current = null;
  setReady(false);
};
```

Terminating matters. A worker is a real background execution context. If the component stops using it, we should shut it down.

---

## 7. Avoiding Stale Worker Results

Workers are asynchronous.

If the user types quickly, multiple queries can be sent. An older query might finish after a newer one.

To avoid showing stale results, every query gets a request ID:

```ts
// ui/src/hooks/useLogAnalytics.ts
const requestId = ++requestIdRef.current;
```

Before posting a query, the worker hook remembers the latest request:

```ts
// ui/src/hooks/useAnalyticsWorker.ts
const query = useCallback((requestId: number, logQuery: LogQuery) => {
  latestRequestIdRef.current = requestId;
  workerRef.current?.postMessage({ type: "QUERY", requestId, query: logQuery });
}, []);
```

When a result comes back, old responses are ignored:

```ts
if (data.result.requestId !== latestRequestIdRef.current) return;
callbacksRef.current.onResult(data.result);
```

### Narration

> Once you move work into a worker, you also move into asynchronous coordination. The request ID is a simple stale-result guard: only the latest query is allowed to update the UI.

---

## 8. Switching Between Main Thread And Worker

The orchestration happens in `useLogAnalytics`.

```ts
// ui/src/hooks/useLogAnalytics.ts
const useWorker = mode === "worker";

useEffect(() => {
  if (logs.length === 0) return;
  if (useWorker && !workerReady) return;

  const requestId = ++requestIdRef.current;
  setIsProcessing(true);

  if (useWorker) {
    workerQuery(requestId, query);
    return;
  }

  const analysis = runMainThreadDemoAnalysis(logs, query, requestId);
  setResult(analysis);
  setLastBlockDurationMs(analysis.durationMs);
  setIsProcessing(false);
}, [useWorker, workerReady, logs, query, workerQuery]);
```

This is the heart of the comparison.

In main-thread mode:

```ts
const analysis = runMainThreadDemoAnalysis(logs, query, requestId);
```

That call is synchronous. React cannot update the UI until it returns.

In worker mode:

```ts
workerQuery(requestId, query);
```

That posts a message and returns immediately. The main thread can continue handling animation and input while the worker computes.

### Narration

> Notice that the branch is not changing the analysis algorithm. It is changing the execution context. Main-thread mode calls the function directly. Worker mode sends a message and lets another thread call the same shared logic.

---

## 9. Debounce Versus Worker

The demo debounces keyword search:

```ts
// ui/src/hooks/useLogFilters.ts
const debouncedKeyword = useDebouncedValue(keyword, DEBOUNCE_MS);
```

Debouncing is useful, but it solves a different problem.

Debounce means:

> Wait until the user pauses before running the expensive work.

It reduces how often we run analysis.

But once analysis starts, if it runs on the main thread, the UI can still freeze.

A worker means:

> Run the expensive work somewhere else so the main thread can keep rendering.

So the clean mental model is:

- debounce controls frequency
- worker controls thread ownership

They are complementary, not interchangeable.

### Narration

> Debouncing makes typing nicer. It does not make expensive JavaScript non-blocking. If the expensive work eventually runs on the main thread, it can still freeze the UI.

---

## 10. What To Show In The Demo

### Main thread mode

1. Select **Main thread**.
2. Search for `applyDiscount`.
3. Point to the spinner freezing.
4. Point to FPS min dropping.
5. Point to the analysis duration.

Say:

> The calculation takes about the same amount of time, but because it is running on the main thread, the browser cannot paint frames during the work.

### Worker mode

1. Select **Web Worker**.
2. Run the same search.
3. Point to the spinner continuing.
4. Point to FPS staying high.
5. Point to a similar analysis duration.

Say:

> The work still takes time. The difference is that the UI thread is free while that work happens.

### Metrics strip

The app also shows the system design shape of the data:

- dataset: 50,000 logs
- returned: 50 rows
- analysis: duration in ms
- thread: main thread or Web Worker

This is the important data flow:

```txt
50,000 logs in memory
        |
        v
analyze globally
        |
        v
return 50 rows + aggregates + timeline
```

That is why the UI can show rich global information without moving huge result sets back and forth on every query.

---

## 11. Mental Model

Use this line in the video:

> A Web Worker does not make the calculation free. It makes the calculation stop competing with rendering.

Another version:

> The main thread is the stage. The worker is backstage. If heavy work happens on the stage, the show stops. If it happens backstage, the show can keep going.

For a more technical audience:

> We are separating computation from presentation. The shared analysis function is pure CPU work. The main thread owns presentation. The worker owns expensive compute.

---

## 12. Final Summary

The pattern is:

1. Keep expensive logic in a reusable pure function.
2. Make sure it does not touch the DOM or React state.
3. In simple mode, call it directly on the main thread.
4. In responsive mode, call it from a Web Worker.
5. Use messages to send input and receive output.
6. Send large data once when possible.
7. Return small UI-ready results.
8. Use request IDs to ignore stale responses.
9. Measure responsiveness with `requestAnimationFrame`.

Closing line:

> Same code, same data, different thread. That is the whole trick.
