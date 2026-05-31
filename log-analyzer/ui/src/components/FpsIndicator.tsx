interface FpsIndicatorProps {
  fps: number;
  isProcessing: boolean;
  lastBlockDurationMs: number | null;
  modeLabel: string;
}

export function FpsIndicator({
  fps,
  isProcessing,
  lastBlockDurationMs,
  modeLabel,
}: FpsIndicatorProps) {
  const healthy = fps >= 55;
  const degraded = fps >= 30 && fps < 55;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className="spinner-ring h-8 w-8 rounded-full border-2 border-zinc-700 border-t-sky-400"
          aria-hidden
        />
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">FPS</div>
          <div
            className={[
              "font-mono text-lg font-semibold",
              healthy ? "text-emerald-400" : degraded ? "text-amber-400" : "text-rose-400",
            ].join(" ")}
          >
            {fps}
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-zinc-800" />

      <div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">Mode</div>
        <div className="text-sm text-zinc-200">{modeLabel}</div>
      </div>

      <div className="h-8 w-px bg-zinc-800" />

      <div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          {isProcessing ? "Analysis" : "Last run"}
        </div>
        <div className="font-mono text-sm text-zinc-200">
          {isProcessing
            ? "Processing…"
            : lastBlockDurationMs !== null
              ? `${lastBlockDurationMs.toFixed(1)} ms`
              : "—"}
        </div>
      </div>
    </div>
  );
}
