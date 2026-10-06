import { Profiler, useMemo, useState, type ProfilerOnRenderCallback } from "react";

import { analyzeLogs, getMeasureRows } from "./lib/analysis";
import { generateLogs } from "./lib/logs";
import type { AnalysisResult, MeasureRow } from "./types/log";

const LOG_COUNT = 20_000;

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="truncate font-mono text-sm font-semibold text-zinc-100">{value}</div>
    </div>
  );
}

export default function App() {
  const logs = useMemo(() => generateLogs(LOG_COUNT), []);
  const [keyword, setKeyword] = useState("timeout");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [measures, setMeasures] = useState<MeasureRow[]>([]);

  // Log only — setState here would re-render the profiled tree in a loop.
  const onProfilerRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
    // console.log(`[React Profiler] ${id} ${phase}: ${actualDuration.toFixed(2)}ms`);
  };

  function runAnalysis() {
    const next = analyzeLogs(logs, { keyword });
    setResult(next);
    setMeasures(getMeasureRows());
  }

  const preview = result?.filteredLogs.slice(0, 40) ?? [];

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-900/80">
        <div className="mx-auto max-w-3xl space-y-2 px-4 py-5 md:px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400/80">
            Frontend System Design Patterns
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-50 md:text-3xl">
            Performance Profiler
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
            Measure with the Performance API, then inspect with Chrome DevTools and React
            Profiler.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-5 md:px-6">
        <div className="overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-lg shadow-black/20">
          <div className="flex flex-col gap-0 sm:flex-row sm:items-stretch">
            <div className="flex min-w-0 flex-1 items-center gap-3 border-b border-zinc-800 px-4 py-3 sm:border-b-0 sm:border-r">
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder='Keyword — try "timeout"'
                className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                spellCheck={false}
              />
            </div>
            <button
              type="button"
              onClick={runAnalysis}
              className="px-4 py-3 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10 sm:min-w-[9rem]"
            >
              Analyze logs
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <p className="text-sm font-medium text-zinc-200">Run summary</p>
          <div className="grid gap-3 border-y border-zinc-800/80 py-3 sm:grid-cols-3">
            <Metric label="Dataset" value={`${logs.length.toLocaleString()} logs`} />
            <Metric
              label="Total"
              value={result ? `${result.durationMs.toFixed(1)} ms` : "—"}
            />
            <Metric
              label="Matches"
              value={result ? result.filteredLogs.length.toLocaleString() : "—"}
            />
          </div>
          <p className="text-sm text-zinc-400">
            Console shows <code className="font-mono text-zinc-300">console.table</code> stage
            timings. Record in DevTools → Performance (flamechart) or Profiler (React commits).
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-200">Stage measures</h2>
          {measures.length === 0 ? (
            <p className="text-sm text-zinc-500">Run analysis to see search / filter / aggregate.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="pb-2 font-medium">Stage</th>
                  <th className="pb-2 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {measures.map((row) => (
                  <tr key={row.name} className="border-t border-zinc-800">
                    <td className="py-2 font-mono text-zinc-200">{row.name}</td>
                    <td className="py-2 font-mono text-zinc-300">{row.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Profiler id="Results" onRender={onProfilerRender}>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="mb-3 text-sm font-medium text-zinc-200">
              Results
              {result && (
                <span className="ml-2 font-sans font-normal text-zinc-500">
                  showing {preview.length} of {result.filteredLogs.length.toLocaleString()}
                </span>
              )}
            </h2>
            {preview.length === 0 ? (
              <p className="text-sm text-zinc-500">No rows yet.</p>
            ) : (
              <ul className="max-h-72 space-y-0 overflow-auto rounded-lg border border-zinc-800">
                {preview.map((log) => (
                  <li
                    key={log.id}
                    className="border-b border-zinc-800 px-3 py-2 text-sm last:border-b-0"
                  >
                    <span className="font-mono text-xs text-zinc-500">
                      {log.level} · {log.service}
                    </span>
                    <div className="text-zinc-200">{log.message}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Profiler>
      </div>
    </div>
  );
}
