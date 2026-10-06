import { useNdjsonFileStream } from "../hooks/useNdjsonFileStream";

import { MarkdownBlock } from "./MarkdownBlock";
import { StreamSpinner } from "./StreamSpinner";

export function NdjsonStreamDemo() {
  const { text, meta, error, isStreaming, start, stop } = useNdjsonFileStream();

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 px-4 py-3">
        <div>
          <h2 className="font-display text-sm font-semibold text-zinc-200">NDJSON file stream</h2>
          {meta ? (
            <p className="text-xs text-zinc-500">
              {meta.source} · {meta.totalChars} chars · {meta.chunkSize}-char chunks
            </p>
          ) : (
            <p className="text-xs text-zinc-500">POST /api/stream → append assistant_delta lines</p>
          )}
        </div>

        <div className="flex gap-2">
          {isStreaming ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Stop
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void start()}
            disabled={isStreaming}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start streaming
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {isStreaming && !text.trim() ? (
          <div className="mb-3 flex items-center gap-2 text-sm text-zinc-500">
            <StreamSpinner />
            <span>Reading stream…</span>
          </div>
        ) : null}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-3">
          <MarkdownBlock text={text} />

          {isStreaming && text.trim() ? (
            <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-sky-400/80 align-[-2px]" aria-hidden />
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
