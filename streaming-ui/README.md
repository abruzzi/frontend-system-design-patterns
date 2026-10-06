# streaming-ui

Minimal demo for **HTTP streaming + NDJSON** in the browser (teaching material for ChatGPT-style UIs).

**Deep dive:** [docs/streaming-guide.md](docs/streaming-guide.md) — server streaming, headers, `consumeNdjsonStream` (reader/decoder/buffer), and FAQ-style notes from building this demo.

Later episodes can add **SSE** (`text/event-stream`) — same UI idea, different line format. See `server/src/index.ts` (NDJSON events) and `ui/src/stream/ndjson.ts`.

## Layout

| Folder | Role |
|--------|------|
| `server/` | Express — reads `content/sample.md`, streams fixed-size chunks as NDJSON |
| `ui/` | Vite + React — button triggers `POST /api/stream`, renders growing markdown |

## Run

Terminal 1 — API (port **8788**):

```bash
cd server && npm install && npm run dev
```

Terminal 2 — UI (Vite proxies `/api` → 8788):

```bash
cd ui && npm install && npm run dev
```

Open the Vite URL, click **Start streaming**.

## Protocol (NDJSON)

One JSON object per line:

```json
{"type":"meta","source":"sample.md","chunkSize":256,"totalChars":1234}
{"type":"assistant_delta","text":"# Hello\n\nThis is "}
{"type":"assistant_delta","text":"chunk two…"}
{"type":"done"}
```

Env (server):

| Variable | Default |
|----------|---------|
| `STREAM_UI_PORT` | `8788` |
| `STREAM_CHUNK_SIZE` | `16` |
| `STREAM_CHUNK_DELAY_MS` | `120` (pause between chunks; use `0` for instant) |
| `STREAM_CONTENT_FILE` | `content/sample.md` (relative to `server/`, or absolute) |

Slower demo for recording:

```bash
STREAM_CHUNK_DELAY_MS=200 npm run dev
```

Replace `server/content/sample.md` with your own markdown for recordings.
