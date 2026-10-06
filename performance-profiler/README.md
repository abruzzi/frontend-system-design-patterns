# Performance Profiler

Minimal React demo for the **Performance API**, **Chrome DevTools flamechart**, and **React Profiler**.

Companion to the Frontend System Design series on [I Code It](https://www.youtube.com/@icodeit.juntao).

## Teaching snippets

Plain walkthrough files in [`snippets/`](./snippets/) — not wired into the app:

1. [`01-performance-now.js`](./snippets/01-performance-now.js) — time the whole op with `performance.now()`
2. [`02-mark-measure.js`](./snippets/02-mark-measure.js) — name stages with `mark()` / `measure()`
3. [`03-react-profiler.jsx`](./snippets/03-react-profiler.jsx) — measure render cost with `<Profiler>`

The runnable UI in `ui/` puts measurement together (now + mark/measure + Profiler logging).

## Run the demo

```bash
# From repo root
npm run setup:performance-profiler
npm run dev:performance-profiler
```

Open [http://localhost:5174](http://localhost:5174). Click **Analyze logs**, then check the Console and DevTools.
