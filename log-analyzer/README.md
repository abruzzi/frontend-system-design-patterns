# Log Analyzer — Web Worker Pattern

A mini Splunk-style incident dashboard. Fetch a chunk of immutable logs once, then filter, aggregate, and paginate entirely on the client — with an optional Web Worker to keep the UI at 60fps.

## Run locally

From the **repo root**:

```bash
npm run setup:log-analyzer   # first time only
npm run dev:log-analyzer
```

Or from this folder:

```bash
npm install --prefix server && npm install --prefix ui
npm run generate-logs --prefix server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## UI

Splunk-style investigation layout (client-side analysis):

- **Keyword search** — filter events by message text
- **Time range presets** — Last 1 hour, 4 hours, 24 hours, 7 days, or All time (anchored to the latest log in the dataset)
- **Timeline chart** — stacked histogram of events by level over the selected range
- **Events table** — paginated log rows

Expand **Processing mode demo** at the bottom to compare naive, debounced, and Web Worker analysis.

## What's in the dataset

The server only stores **raw application events** — no alert text, no incident tickets, no "someone flipped a toggle" annotations. A latent rollout failure is embedded in the logs:

- Around **Wed 2:30pm PT**, `payment-service` / `prod` starts logging repeated `PriceCalculator.applyDiscount` errors
- Volume grows over ~30 minutes (percentage rollout simulated server-side, not logged as metadata)
- Errors stop abruptly ~38 minutes after the first failure
- Normal `POST /api/checkout 200` traffic resumes

**Your job as investigator:** search, chart the timeline, group by message/traceId, and infer what happened.

Try searching `PriceCalculator`, `checkout-v2`, or filtering **ERROR** on `payment-service` / `prod` with **Last 4 hours**.

## Demo modes

| Mode | Behavior |
|------|----------|
| **Naive main thread** | Filter on every keystroke — input and animations freeze |
| **Debounced main thread** | Typing feels smooth, but UI hitches after you stop typing |
| **Debounced + Web Worker** | Typing smooth *and* UI stays responsive while analysis runs |

## Architecture

```
URL params (?service=&env=&from=&to=)
        │
        ▼
   GET /api/logs  ──► 50,000 log lines (one fetch)
        │
        ▼
   Main thread (React UI)
        │ postMessage { QUERY, page, pageSize, keyword, level }
        ▼
   analytics.worker.ts
        │ filter + aggregate globally, paginate locally
        ▼
   Main thread ◄── only 50 rows + metadata cross the boundary
```

## Key lessons

1. **Compute globally, transfer minimally** — aggregations over full dataset; only `pageSize` rows serialized back.
2. **Debouncing ≠ non-blocking** — debounce delays work; workers relocate it off the main thread.
3. **Stale result cancellation** — `requestId` drops outdated worker responses when the user types fast.
