import type { LogAggregations } from "../types/log";

interface LevelSummaryProps {
  aggregations: LogAggregations;
  totalMatches: number;
}

const COLORS: Record<keyof LogAggregations, string> = {
  ERROR: "text-rose-400",
  WARN: "text-amber-300",
  INFO: "text-sky-300",
  DEBUG: "text-zinc-400",
};

const DOTS: Record<keyof LogAggregations, string> = {
  ERROR: "bg-rose-500",
  WARN: "bg-amber-400",
  INFO: "bg-sky-400",
  DEBUG: "bg-zinc-500",
};

export function LevelSummary({ aggregations, totalMatches }: LevelSummaryProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <div className="text-xs text-zinc-500">
        <span className="font-medium text-zinc-300">{totalMatches.toLocaleString()}</span> matching
        events
      </div>
      <div className="flex flex-wrap gap-4">
        {(Object.keys(aggregations) as (keyof LogAggregations)[]).map((level) => (
          <div key={level} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${DOTS[level]}`} />
            <span className="text-xs text-zinc-500">{level}</span>
            <span className={`font-mono text-sm ${COLORS[level]}`}>
              {aggregations[level].toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
