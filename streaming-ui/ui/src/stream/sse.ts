/**
 * Demo 2 (not wired yet): Server-Sent Events parser.
 *
 * OpenAI / Gemini-style APIs often stream:
 *   data: {"choices":[{"delta":{"content":"Hi"}}]}
 *
 *   data: [DONE]
 *
 * A future demo would implement `consumeSseStream(body, handlers)` and map
 * `delta.content` → the same `onTextDelta` used by the NDJSON demo.
 */

export {};
