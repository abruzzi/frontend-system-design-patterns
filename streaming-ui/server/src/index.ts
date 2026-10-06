import cors from "cors";
import express from "express";
import fs from "node:fs/promises";

import { config } from "./config.js";

/** NDJSON stream events for demo 1. Demo 2 (SSE): `data: {...}\n\n` instead of `{...}\n`. */
type StreamEvent =
  | { type: "meta"; source: string; chunkSize: number; totalChars: number }
  | { type: "assistant_delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    chunkSize: config.chunkSize,
    chunkDelayMs: config.chunkDelayMs,
    contentFile: config.contentFile,
  });
});

app.post("/api/stream", async (req, res) => {
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const markdown = await fs.readFile(config.contentPath, "utf8");

    const meta: StreamEvent = {
      type: "meta",
      source: config.contentSource,
      chunkSize: config.chunkSize,
      totalChars: markdown.length,
    };

    res.write(`${JSON.stringify(meta)}\n`);

    for (let offset = 0; offset < markdown.length; offset += config.chunkSize) {
      const text = markdown.slice(offset, offset + config.chunkSize);
      res.write(`${JSON.stringify({ type: "assistant_delta", text })}\n`);

      if (config.chunkDelayMs > 0 && offset + config.chunkSize < markdown.length) {
        await delay(config.chunkDelayMs);
      }
    }

    res.write(`${JSON.stringify({ type: "done" })}\n`);
    res.end();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.write(`${JSON.stringify({ type: "error", message })}\n`);
    res.end();
  }
});

app.listen(config.port, () => {
  process.stderr.write(
    `streaming-ui server http://127.0.0.1:${config.port}\n` +
      `  POST /api/stream  NDJSON (${config.chunkSize}-char chunks, ${config.chunkDelayMs}ms pause)\n`
  );
});
