import { useMemo, useState } from "react";

import { formatTimeAxis } from "../lib/timeRange";
import type { TimelineBucket } from "../types/log";

interface TimelineChartProps {
  timeline: TimelineBucket[];
  totalMatches: number;
  fromMs: number;
  toMs: number;
}

const LEVEL_COLORS = {
  ERROR: "bg-rose-500",
  WARN: "bg-amber-400",
  INFO: "bg-sky-400",
  DEBUG: "bg-zinc-500",
} as const;

export function TimelineChart({
  timeline,
  totalMatches,
  fromMs,
  toMs,
}: TimelineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxCount = useMemo(
    () => Math.max(1, ...timeline.map((bucket) => bucket.count)),
    [timeline]
  );

  const hovered = hoveredIndex !== null ? timeline[hoveredIndex] : null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold text-zinc-100">Timeline</h2>
          <p className="text-xs text-zinc-500">
            Event distribution across the selected time range
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-semibold text-zinc-100">
            {totalMatches.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-500">events</div>
        </div>
      </div>

      <div
        className="relative flex h-36 items-end gap-px rounded-lg bg-zinc-950/80 px-1 pb-1 pt-6"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {timeline.map((bucket, index) => {
          const heightPct = (bucket.count / maxCount) * 100;
          const levels = (["ERROR", "WARN", "INFO", "DEBUG"] as const).filter(
            (level) => bucket.byLevel[level] > 0
          );

          return (
            <div
              key={`${bucket.startMs}-${index}`}
              className="relative flex min-w-0 flex-1 flex-col justify-end"
              style={{ height: "100%" }}
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <div
                className="flex w-full flex-col-reverse overflow-hidden rounded-t-sm transition-opacity"
                style={{
                  height: `${Math.max(heightPct, bucket.count > 0 ? 2 : 0)}%`,
                  opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.35,
                }}
              >
                {levels.length === 0 ? (
                  <div className="h-full w-full bg-zinc-800/40" />
                ) : (
                  levels.map((level) => {
                    const levelPct = (bucket.byLevel[level] / bucket.count) * 100;
                    return (
                      <div
                        key={level}
                        className={LEVEL_COLORS[level]}
                        style={{ height: `${levelPct}%` }}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {hovered && hovered.count > 0 && (
          <div className="pointer-events-none absolute left-1/2 top-1 z-10 -translate-x-1/2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
            <div className="font-medium text-zinc-200">{hovered.count.toLocaleString()} events</div>
            <div className="mt-0.5 text-zinc-500">
              {formatTimeAxis(hovered.startMs)} – {formatTimeAxis(hovered.endMs)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-600">
        <span>{formatTimeAxis(fromMs)}</span>
        <div className="flex items-center gap-3">
          {(Object.keys(LEVEL_COLORS) as (keyof typeof LEVEL_COLORS)[]).map((level) => (
            <span key={level} className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${LEVEL_COLORS[level]}`} />
              {level}
            </span>
          ))}
        </div>
        <span>{formatTimeAxis(toMs)}</span>
      </div>
    </div>
  );
}
