import type { LogEntry } from "../types/log";
import { PAGE_SIZE } from "../types/log";

interface LogTableProps {
  rows: LogEntry[];
  page: number;
  totalMatches: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

const LEVEL_STYLES: Record<LogEntry["level"], string> = {
  ERROR: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  WARN: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  INFO: "text-sky-300 bg-sky-500/10 border-sky-500/20",
  DEBUG: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
};

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
              className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[auto_1fr_auto]"
            >
              <span
                className={[
                  "inline-flex w-fit rounded-md border px-2 py-0.5 font-mono text-xs",
                  LEVEL_STYLES[row.level],
                ].join(" ")}
              >
                {row.level}
              </span>
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
