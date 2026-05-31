import { analyzeLogs } from "../lib/analysis";
import type { LogEntry, LogQuery } from "../types/log";

type WorkerInbound =
  | { type: "INGEST"; logs: LogEntry[] }
  | { type: "QUERY"; requestId: number; query: LogQuery };

type WorkerOutbound =
  | { type: "INGESTED"; total: number }
  | { type: "RESULT"; result: ReturnType<typeof analyzeLogs> }
  | { type: "ERROR"; message: string };

let sourceLogs: LogEntry[] = [];

self.onmessage = (event: MessageEvent<WorkerInbound>) => {
  const message = event.data;

  try {
    if (message.type === "INGEST") {
      sourceLogs = message.logs;
      const outbound: WorkerOutbound = { type: "INGESTED", total: sourceLogs.length };
      self.postMessage(outbound);
      return;
    }

    if (message.type === "QUERY") {
      const result = analyzeLogs(sourceLogs, message.query, message.requestId);
      const outbound: WorkerOutbound = { type: "RESULT", result };
      self.postMessage(outbound);
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const outbound: WorkerOutbound = { type: "ERROR", message: msg };
    self.postMessage(outbound);
  }
};

export {};
