import type { LevelFilter, TimeRangePreset } from "../types/log";
import { TIME_RANGE_LABELS, TIME_RANGE_PRESETS } from "../lib/timeRange";

interface SearchBarProps {
  keyword: string;
  level: LevelFilter;
  timeRange: TimeRangePreset;
  isProcessing: boolean;
  onKeywordChange: (value: string) => void;
  onLevelChange: (value: LevelFilter) => void;
  onTimeRangeChange: (value: TimeRangePreset) => void;
}

const LEVELS: LevelFilter[] = ["ALL", "ERROR", "WARN", "INFO", "DEBUG"];

export function SearchBar({
  keyword,
  level,
  timeRange,
  isProcessing,
  onKeywordChange,
  onLevelChange,
  onTimeRangeChange,
}: SearchBarProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-0 lg:flex-row lg:items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-3 border-b border-zinc-800 px-4 py-3 lg:border-b-0 lg:border-r">
          <svg
            className="h-5 w-5 shrink-0 text-emerald-400/80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder='Search logs — try "PriceCalculator", "checkout-v2", "POST /api/checkout"'
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            spellCheck={false}
          />
          {isProcessing && (
            <span className="shrink-0 font-mono text-xs text-emerald-400/70">Searching…</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-3 py-2 lg:border-b-0 lg:border-r lg:px-4">
          {TIME_RANGE_PRESETS.map((preset) => {
            const active = preset === timeRange;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onTimeRangeChange(preset)}
                className={[
                  "rounded-md px-2.5 py-1.5 text-xs font-medium transition",
                  active
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                ].join(" ")}
              >
                {TIME_RANGE_LABELS[preset]}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 px-4 py-3 lg:min-w-[9rem]">
          <span className="sr-only">Log level</span>
          <select
            value={level}
            onChange={(e) => onLevelChange(e.target.value as LevelFilter)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          >
            {LEVELS.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "All levels" : item}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
