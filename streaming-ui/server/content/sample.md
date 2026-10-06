# Streaming UI demo

This markdown file is read by the **server** and sent to the browser in **fixed-size chunks** (default **256 characters**). Each chunk is one NDJSON line:

```json
{"type":"assistant_delta","text":"…"}
```

The **frontend** appends `text` and re-renders this document as it grows — the same pattern as a chat assistant typing out a reply.

## Why chunks?

TCP and HTTP do not guarantee “one chunk = one sentence.” The server *chooses* a chunk size so the UI updates in visible steps. In production APIs you often see:

- **NDJSON** — one JSON object per line (this demo, Ollama-style)
- **SSE** — `data: {…}` frames (OpenAI / Gemini style)

## A short list

1. Button sends `POST /api/stream`
2. Response body stays open
3. `fetch` + `ReadableStream` reads bytes incrementally
4. Parser splits on newlines and updates React state
5. `{ "type": "done" }` ends the stream

## Code sample

```ts
await consumeNdjsonStream(response.body, (event) => {
  if (event.type === "assistant_delta") {
    setText((previous) => previous + event.text);
  }
});
```

When the stream finishes, you should see this paragraph complete — including **bold** and *italic* formatting from markdown.
