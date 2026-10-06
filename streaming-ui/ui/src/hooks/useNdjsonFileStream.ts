import { useCallback, useRef, useState } from "react";

import { consumeNdjsonStream } from "../stream/ndjson";
import type { StreamEvent } from "../stream/events";

export type StreamMeta = {
  source: string;
  chunkSize: number;
  totalChars: number;
};

export function useNdjsonFileStream() {
  const [text, setText] = useState("");
  const [meta, setMeta] = useState<StreamMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  const applyEvent = useCallback((event: StreamEvent) => {
    if (event.type === "meta") {
      setMeta({
        source: event.source,
        chunkSize: event.chunkSize,
        totalChars: event.totalChars,
      });
      return;
    }

    if (event.type === "assistant_delta") {
      setText((previous) => previous + event.text);
      return;
    }

    if (event.type === "error") {
      setError(event.message);
      setIsStreaming(false);
      return;
    }

    if (event.type === "done") {
      setIsStreaming(false);
    }
  }, []);

  const start = useCallback(async () => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    abortRef.current?.abort();

    const abortController = new AbortController();
    abortRef.current = abortController;

    setText("");
    setMeta(null);
    setError(null);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        applyEvent({ type: "error", message: errorText || `HTTP ${response.status}` });
        return;
      }

      await consumeNdjsonStream(response.body, applyEvent);
    } catch (caughtError: unknown) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        return;
      }

      const message = caughtError instanceof Error ? caughtError.message : String(caughtError);
      applyEvent({ type: "error", message });
    } finally {
      inFlightRef.current = false;
      setIsStreaming(false);
    }
  }, [applyEvent]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { text, meta, error, isStreaming, start, stop };
}
