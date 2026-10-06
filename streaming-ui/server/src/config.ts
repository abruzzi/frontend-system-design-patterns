import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULTS = {
  port: 8788,
  chunkSize: 16,
  /** Pause between chunks so the UI update is visible (demo / recording). */
  chunkDelayMs: 120,
  contentFile: "content/agentic-coding.md",
} as const;

export type ServerConfig = {
  port: number;
  chunkSize: number;
  chunkDelayMs: number;
  /** Path relative to `server/` (or absolute) for health / display. */
  contentFile: string;
  /** Resolved path passed to `fs.readFile`. */
  contentPath: string;
  /** Basename of content file (stream meta `source`). */
  contentSource: string;
};

function parseIntEnv(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveContentPath(contentFile: string): string {
  return path.isAbsolute(contentFile) ? contentFile : path.join(serverRoot, contentFile);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const port = parseIntEnv(env["STREAM_UI_PORT"], DEFAULTS.port);
  const chunkSize = parseIntEnv(env["STREAM_CHUNK_SIZE"], DEFAULTS.chunkSize);
  const chunkDelayMs = parseIntEnv(env["STREAM_CHUNK_DELAY_MS"], DEFAULTS.chunkDelayMs);
  const contentFile = env["STREAM_CONTENT_FILE"]?.trim() || DEFAULTS.contentFile;
  const contentPath = resolveContentPath(contentFile);

  return {
    port: port > 0 ? port : DEFAULTS.port,
    chunkSize: chunkSize > 0 ? chunkSize : DEFAULTS.chunkSize,
    chunkDelayMs: chunkDelayMs >= 0 ? chunkDelayMs : DEFAULTS.chunkDelayMs,
    contentFile,
    contentPath,
    contentSource: path.basename(contentPath),
  };
}

export const config = loadConfig();
