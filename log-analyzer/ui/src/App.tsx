import { useMemo, useState } from "react";

import { LevelSummary } from "./components/LevelSummary";
import { FpsIndicator } from "./components/FpsIndicator";
import { Header } from "./components/Header";
import { LogTable } from "./components/LogTable";
import { ProcessingModeToggle } from "./components/ProcessingModeToggle";
import { SearchBar } from "./components/SearchBar";
import { TimelineChart } from "./components/TimelineChart";
import { placeholderResult, useLogAnalytics } from "./hooks/useLogAnalytics";
import { useFps } from "./hooks/useFps";
import type { ProcessingMode } from "./types/log";

const MODE_LABELS: Record<ProcessingMode, string> = {
  main: "Main thread",
  worker: "Web Worker",
};

export default function App() {
  const [mode, setMode] = useState<ProcessingMode>("main");
  const fps = useFps();

  const {
    logs,
    meta,
    result,
    loading,
    error,
    keyword,
    level,
    timeRange,
    timeWindow,
    page,
    isProcessing,
    lastBlockDurationMs,
    setKeyword,
    setLevel,
    setTimeRange,
    goToNextPage,
    goToPrevPage,
  } = useLogAnalytics({ mode });

  const displayResult = result ?? placeholderResult();

  const demoTip = useMemo(() => {
    if (mode === "main") {
      return 'Main thread is active. Search "applyDiscount", then click a time-range pill — the spinner should freeze and min FPS should drop.';
    }
    return "Web Worker is active. Repeat the same steps — the spinner should keep moving and min FPS should stay near 60.";
  }, [mode]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-900/80">
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
          <Header meta={meta} ingestedCount={logs.length} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 md:px-6">
        <SearchBar
          keyword={keyword}
          level={level}
          timeRange={timeRange}
          isProcessing={isProcessing}
          onKeywordChange={setKeyword}
          onLevelChange={setLevel}
          onTimeRangeChange={setTimeRange}
        />

        <div className="space-y-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-zinc-200">Where analysis runs</p>
            <span
              className={[
                "rounded-full px-2.5 py-0.5 font-mono text-xs font-medium",
                mode === "main"
                  ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
                  : "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
              ].join(" ")}
            >
              Active: {MODE_LABELS[mode]}
            </span>
          </div>
          <ProcessingModeToggle mode={mode} onChange={setMode} />
          <FpsIndicator
            fps={fps}
            isProcessing={isProcessing}
            lastBlockDurationMs={lastBlockDurationMs}
            modeLabel={MODE_LABELS[mode]}
          />
          <p className="text-sm text-zinc-400">{demoTip}</p>
        </div>

        {loading && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-8 text-center text-sm text-zinc-400">
            Loading log dataset from server…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <TimelineChart
              timeline={displayResult.timeline}
              totalMatches={displayResult.totalMatches}
              fromMs={timeWindow.fromMs}
              toMs={timeWindow.toMs}
            />

            <LevelSummary
              aggregations={displayResult.aggregations}
              totalMatches={displayResult.totalMatches}
            />

            <LogTable
              rows={displayResult.filteredRows}
              page={page}
              totalMatches={displayResult.totalMatches}
              onPrevPage={goToPrevPage}
              onNextPage={goToNextPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
