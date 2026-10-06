import type { StreamEvent } from "./events";

/**
 * Read a fetch body as newline-delimited JSON (NDJSON).
 * Same pattern as octo's `consumeNdjsonStream` — one parsed object per line.
 */
export async function consumeNdjsonStream(
  body: ReadableStream<Uint8Array> | null,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  if (!body) throw new Error("Response has no body");

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;

      buffer += decoder.decode(chunk, { stream: true });

      for (;;) {
        const newlineIndex = buffer.indexOf("\n");
        if (newlineIndex < 0) break;

        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) continue;

        try {
          onEvent(JSON.parse(line) as StreamEvent);
        } catch {
          /* ignore malformed line */
        }
      }
    }

    const tail = buffer.trim();
    if (tail) {
      try {
        onEvent(JSON.parse(tail) as StreamEvent);
      } catch {
        /* ignore */
      }
    }
  } finally {
    reader.releaseLock();
  }
}
