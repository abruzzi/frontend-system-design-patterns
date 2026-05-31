import type { LogsResponse } from "../types/log";

interface HeaderProps {
  meta: LogsResponse["meta"] | null;
  ingestedCount: number;
}

export function Header({ meta, ingestedCount }: HeaderProps) {
  return (
    <header className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400/80">
        Frontend System Design Patterns
      </p>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-50 md:text-3xl">
        Log Analyzer
      </h1>
      <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
        Search and investigate logs — fetch once, filter and aggregate on the client.
      </p>
      {meta && (
        <div className="flex flex-wrap gap-2 pt-1 text-xs text-zinc-500">
          <span className="rounded-full border border-zinc-800 px-2.5 py-1">
            Ingested {ingestedCount.toLocaleString()} logs
          </span>
          {meta.service && (
            <span className="rounded-full border border-zinc-800 px-2.5 py-1">
              service={meta.service}
            </span>
          )}
          {meta.env && (
            <span className="rounded-full border border-zinc-800 px-2.5 py-1">
              env={meta.env}
            </span>
          )}
        </div>
      )}
    </header>
  );
}
