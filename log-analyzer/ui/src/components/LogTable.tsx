import type { LogEntry } from "../types/log";
import { PAGE_SIZE } from "../types/log";

interface LogTableProps {
  rows: LogEntry[];
  page: number;
  totalMatches: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

const LEVEL_STYLES: Record<
  LogEntry["level"],
  { badge: string; dot: string }
> = {
  ERROR: {
    badge:
      "bg-rose-950/90 text-rose-200 ring-1 ring-rose-500/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_14px_rgba(244,63,94,0.12)]",
    dot: "bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.55)]",
  },
  WARN: {
    badge:
      "bg-amber-950/80 text-amber-200 ring-1 ring-amber-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
    dot: "bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.45)]",
  },
  INFO: {
    badge:
      "bg-sky-950/70 text-sky-200 ring-1 ring-sky-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
    dot: "bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.4)]",
  },
  DEBUG: {
    badge:
      "bg-zinc-900/90 text-zinc-400 ring-1 ring-zinc-600/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    dot: "bg-zinc-500",
  },
};

function LevelBadge({ level }: { level: LogEntry["level"] }) {
  const style = LEVEL_STYLES[level];

  return (
    <span
      className={[
        "inline-flex w-[4.75rem] shrink-0 items-center justify-center gap-1.5 rounded-full px-2 py-1",
        "font-mono text-[10px] font-semibold uppercase tracking-[0.12em]",
        style.badge,
      ].join(" ")}
    >
      <span
        className={["h-1.5 w-1.5 shrink-0 rounded-full", style.dot].join(" ")}
        aria-hidden
      />
      {level}
    </span>
  );
}

export function LogTable({
  rows,
  page,
  totalMatches,
  onPrevPage,
  onNextPage,
}: LogTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  const start = totalMatches === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalMatches);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <h2 className="font-display text-sm font-semibold text-zinc-100">Events</h2>
          <p className="text-xs text-zinc-500">
            Paginated results — {PAGE_SIZE} rows per page
          </p>
        </div>
        <div className="text-right text-xs text-zinc-400">
          {totalMatches === 0
            ? "No matches"
            : `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${totalMatches.toLocaleString()}`}
        </div>
      </div>

      <div className="divide-y divide-zinc-800/80">
        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            No logs match the current filters.
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[4.75rem_1fr_auto] md:items-start"
            >
              <LevelBadge level={row.level} />
              <div>
                <div className="font-mono text-zinc-200">{row.message}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {row.service} · {row.env} · {row.timestamp}
                </div>
              </div>
              <div className="font-mono text-xs text-zinc-600">{row.traceId}</div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
        <button
          type="button"
          onClick={onPrevPage}
          disabled={page <= 1}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="font-mono text-xs text-zinc-500">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNextPage}
          disabled={page >= totalPages}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
