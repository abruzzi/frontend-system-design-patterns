# Frontend System Design Patterns

Small, runnable examples that accompany the **Frontend System Design Essentials** series on [I Code It](https://www.youtube.com/@icodeit.juntao).

Each folder is a self-contained pattern demo — Vite + Tailwind CSS, mostly React and TypeScript — so you can clone, run, and experiment locally.

## Examples

| Pattern | Folder | What it demonstrates |
|---------|--------|----------------------|
| Web Worker log analyzer | [`log-analyzer/`](./log-analyzer/) | Fetch-once / slice-locally, worker-side pagination, debounce vs main-thread blocking |
| Performance API + profilers | [`performance-profiler/`](./performance-profiler/) | `performance.now` / `mark` / `measure`, Chrome flamechart, React Profiler |
| Media Source Extensions | [`media-source/`](./media-source/) | Native `<video src>` vs `MediaSource` + `SourceBuffer`, then adaptive bitrate from bandwidth + buffer |
| High-performance whiteboard | [`whiteboard/`](./whiteboard/) | Canvas scene model, hit testing, spatial index, viewport culling, frame-aligned rendering |
| Streaming AI UI (NDJSON) | [`streaming-ui/`](./streaming-ui/) | HTTP streaming + NDJSON: server chunks, client buffer/parse, incremental markdown render |

## Quick start

```bash
# From repo root — first time setup for log-analyzer
npm install
npm run setup:log-analyzer

# Run API + UI together
npm run dev:log-analyzer
```

Open [http://localhost:5173](http://localhost:5173). Try the three processing modes and watch the FPS indicator while filtering 50,000 log lines.

```bash
# Performance API / DevTools / React Profiler demo (no server)
npm run setup:performance-profiler
npm run dev:performance-profiler
```

Open [http://localhost:5174](http://localhost:5174). Click **Analyze logs**, then inspect Console measures and Chrome Performance / React Profiler.

```bash
# MediaSource / SourceBuffer demo (vanilla JS, no server)
npm run setup:media-source
npm run dev:media-source
```

Open [http://localhost:5175](http://localhost:5175). Compare **Native Video**, **Basic MSE**, **Streaming Demo**, and **Adaptive**. In streaming mode, let the buffer run out, then click **Load Next Segment**. In adaptive mode, switch Fast / Slow and watch the chosen quality change.

```bash
# High-performance Canvas whiteboard (no server)
npm run setup:whiteboard
npm run dev:whiteboard
```

Open [http://localhost:5177](http://localhost:5177). Draw or seed 10 → 10,000 shapes, then toggle culling / spatial index / rAF while watching FPS.

```bash
# Streaming AI UI — NDJSON HTTP stream (API + UI)
npm run setup:streaming-ui
npm run dev:streaming-ui
```

Open the Vite URL printed in the terminal, click **Start streaming**. Deep dive: [`streaming-ui/docs/streaming-guide.md`](./streaming-ui/docs/streaming-guide.md).

## Tech stack

- **UI:** Vite, Tailwind CSS — React 19 + TypeScript for most demos; vanilla JS for Media Source
- **Server:** Node.js, Express, TypeScript (where a demo needs an API)

## Adding a new pattern

1. Create `your-pattern/` with a `ui/` folder (and `server/` if the demo needs an API). Copy `log-analyzer/` or `media-source/`.
2. Add scripts to the root `package.json`.
3. Document the pattern in this README.
