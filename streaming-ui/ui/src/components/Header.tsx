export function Header() {
  return (
    <header className="shrink-0 border-b border-zinc-800/80 pb-6">
      <div className="font-display text-xl font-semibold tracking-tight text-white">Streaming UI</div>
      <p className="mt-1 text-sm text-zinc-500">
        Demo 1 — NDJSON over HTTP. SSE variant: see <code className="text-zinc-400">ui/src/stream/sse.ts</code>
      </p>
    </header>
  );
}
