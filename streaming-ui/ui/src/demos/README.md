# Future demos (placeholders)

| Demo | Status | Files |
|------|--------|--------|
| 1. NDJSON file stream | **Active** — `NdjsonStreamDemo`, `server/src/index.ts` |
| 2. SSE (OpenAI-style) | Placeholder — `ui/src/stream/sse.ts` |
| 3. Full chat UI | Placeholder — reuse octo-style transcript later |

Wire demo 2 by parsing `data:` lines and calling the same `onTextDelta` as demo 1.
