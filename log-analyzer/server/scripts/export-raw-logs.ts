import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { LogEntry } from "../src/types.js";

function formatRawLine(entry: LogEntry): string {
  return [
    entry.timestamp,
    entry.level.padEnd(5),
    entry.service,
    entry.env,
    `trace=${entry.traceId}`,
    entry.message,
  ].join(" ");
}

async function main(): Promise<void> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dataDir = path.resolve(__dirname, "../data");
  const inputPath = path.join(dataDir, "logs.json");
  const jsonlPath = path.join(dataDir, "logs.jsonl");
  const rawPath = path.join(dataDir, "logs.raw.log");

  const format = process.argv[2] ?? "both";

  if (!fs.existsSync(inputPath)) {
    process.stderr.write(`Missing ${inputPath} — run npm run generate-logs first.\n`);
    process.exit(1);
  }

  const logs = JSON.parse(fs.readFileSync(inputPath, "utf8")) as LogEntry[];

  if (format === "jsonl" || format === "both") {
    const jsonl = logs.map((entry) => JSON.stringify(entry)).join("\n") + "\n";
    fs.writeFileSync(jsonlPath, jsonl);
  }

  if (format === "raw" || format === "both") {
    const raw = logs.map(formatRawLine).join("\n") + "\n";
    fs.writeFileSync(rawPath, raw);
  }

  const jsonlStat = fs.existsSync(jsonlPath) ? fs.statSync(jsonlPath) : null;
  const rawStat = fs.existsSync(rawPath) ? fs.statSync(rawPath) : null;

  process.stdout.write(
    `Exported ${logs.length.toLocaleString()} entries from logs.json\n` +
      (jsonlStat
        ? `  logs.jsonl     ${(jsonlStat.size / (1024 * 1024)).toFixed(2)} MB (one JSON object per line)\n`
        : "") +
      (rawStat
        ? `  logs.raw.log   ${(rawStat.size / (1024 * 1024)).toFixed(2)} MB (plain text per line)\n`
        : "")
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`export-raw-logs failed: ${message}\n`);
  process.exit(1);
});
