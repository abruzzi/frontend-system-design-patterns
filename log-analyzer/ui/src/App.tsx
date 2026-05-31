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
  "naive-main": "Naive main thread",
  "debounced-main": "Debounced main thread",
  worker: "Debounced + Web Worker",
};

export default function App() {
  const [mode, setMode] = useState<ProcessingMode>("worker");
  const [showDemoPanel, setShowDemoPanel] = useState(false);
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
    if (mode === "naive-main") {
      return "Type quickly in the search box — input should lag because filtering runs on every keystroke.";
    }
    if (mode === "debounced-main") {
      return 'Type a keyword, stop, then immediately click the level filter. The UI may hitch even though typing felt smooth.';
    }
    return "Repeat the same test — the spinner and filter controls should stay responsive while the worker processes.";
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

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30">
          <button
            type="button"
            onClick={() => setShowDemoPanel((open) => !open)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-zinc-400 hover:text-zinc-200"
          >
            <span className="font-medium">Processing mode demo</span>
            <span className="font-mono text-xs">{showDemoPanel ? "▾" : "▸"}</span>
          </button>

          {showDemoPanel && (
            <div className="space-y-4 border-t border-zinc-800 px-4 py-4">
              <ProcessingModeToggle mode={mode} onChange={setMode} />
              <FpsIndicator
                fps={fps}
                isProcessing={isProcessing}
                lastBlockDurationMs={lastBlockDurationMs}
                modeLabel={MODE_LABELS[mode]}
              />
              <p className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Demo tip:</span> {demoTip}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
