import { runWorkerDemoAnalysis } from "../lib/analysis";
import type { AnalysisResult, LogEntry, LogQuery } from "../types/log";

type WorkerInbound =
  | { type: "INGEST"; logs: LogEntry[] }
  | { type: "QUERY"; requestId: number; query: LogQuery };

type WorkerOutbound =
  | { type: "INGESTED"; total: number }
  | { type: "RESULT"; result: AnalysisResult }
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
      const result = runWorkerDemoAnalysis(sourceLogs, message.query, message.requestId);
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
