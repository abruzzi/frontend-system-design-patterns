/** NDJSON events from POST /api/stream (demo 1). */

export type StreamEvent =
  | { type: "meta"; source: string; chunkSize: number; totalChars: number }
  | { type: "assistant_delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

/** Demo 2 placeholder: parse SSE `data:` lines into the same handlers. */
export type StreamHandlers = {
  onMeta?: (event: Extract<StreamEvent, { type: "meta" }>) => void;
  onTextDelta: (text: string) => void;
  onDone?: () => void;
  onError: (message: string) => void;
};
