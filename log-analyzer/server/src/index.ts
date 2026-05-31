import cors from "cors";
import express from "express";
import fs from "node:fs/promises";

import { config } from "./config.js";
import { generateLogs } from "../scripts/generate-logs.js";
import type { LogEntry, LogsResponse } from "./types.js";

async function loadLogs(): Promise<LogEntry[]> {
  try {
    const raw = await fs.readFile(config.dataPath, "utf8");
    return JSON.parse(raw) as LogEntry[];
  } catch {
    process.stderr.write(
      `logs.json not found — generating ${config.defaultLogCount.toLocaleString()} logs...\n`
    );
    const logs = generateLogs(config.defaultLogCount);
    await fs.mkdir(new URL("../data/", import.meta.url), { recursive: true });
    await fs.writeFile(config.dataPath, JSON.stringify(logs));
    return logs;
  }
}

function filterLogs(
  logs: LogEntry[],
  params: {
    service: string | null;
    env: string | null;
    from: string | null;
    to: string | null;
  }
): LogEntry[] {
  const fromMs = params.from ? Date.parse(params.from) : null;
  const toMs = params.to ? Date.parse(params.to) : null;

  return logs.filter((log) => {
    if (params.service && log.service !== params.service) return false;
    if (params.env && log.env !== params.env) return false;

    const ts = Date.parse(log.timestamp);
    if (fromMs !== null && ts < fromMs) return false;
    if (toMs !== null && ts > toMs) return false;

    return true;
  });
}

const app = express();
app.use(cors());

let cachedLogs: LogEntry[] | null = null;

app.get("/health", (_req, res) => {
  res.json({ ok: true, port: config.port });
});

app.get("/api/logs", async (req, res) => {
  if (!cachedLogs) {
    cachedLogs = await loadLogs();
  }

  const service = typeof req.query.service === "string" ? req.query.service : null;
  const env = typeof req.query.env === "string" ? req.query.env : null;
  const from = typeof req.query.from === "string" ? req.query.from : null;
  const to = typeof req.query.to === "string" ? req.query.to : null;

  const filtered = filterLogs(cachedLogs, { service, env, from, to });

  const response: LogsResponse = {
    logs: filtered,
    meta: {
      total: filtered.length,
      service,
      env,
      from,
      to,
      generatedAt: new Date().toISOString(),
    },
  };

  res.json(response);
});

app.listen(config.port, () => {
  process.stderr.write(
    `log-analyzer server http://127.0.0.1:${config.port}\n` +
      `  GET /api/logs?service=auth-service&env=prod&from=...&to=...\n`
  );
});
