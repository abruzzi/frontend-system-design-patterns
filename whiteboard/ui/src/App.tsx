import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { WhiteboardEngine } from "./engine/engine";
import type { Tool } from "./engine/types";
import { useFps } from "./hooks/useFps";

const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: "select", label: "Select", hint: "V" },
  { id: "rectangle", label: "Rectangle", hint: "R" },
  { id: "pan", label: "Pan", hint: "H" },
];

const SEEDS = [10, 1_000, 10_000, 100_000];

export default function App() {
  const engine = useMemo(() => new WhiteboardEngine(), []);
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fps = useFps();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const detach = engine.attach(canvas);

    const onDown = (event: PointerEvent) => {
      event.preventDefault();
      engine.pointerDown(event);
    };
    const onMove = (event: PointerEvent) => engine.pointerMove(event);
    const onUp = () => engine.pointerUp();
    const onWheel = (event: WheelEvent) => engine.wheel(event);
    const onContext = (event: Event) => event.preventDefault();

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContext);

    return () => {
      detach();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContext);
    };
  }, [engine]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;

      if (event.code === "Space") {
        event.preventDefault();
        engine.setSpaceDown(true);
        return;
      }

      if (event.key === "v" || event.key === "V") engine.setTool("select");
      if (event.key === "r" || event.key === "R") engine.setTool("rectangle");
      if (event.key === "h" || event.key === "H") engine.setTool("pan");
      if (event.key === "0") engine.fit();
      if (event.key === "Backspace" || event.key === "Delete") engine.deleteSelected();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        engine.setSpaceDown(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [engine]);

  const fpsHealthy = fps.min >= 55;
  const fpsDegraded = fps.min >= 30 && fps.min < 55;

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex flex-wrap items-end justify-between gap-4 px-4 py-4 md:px-6">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400/80">
              Frontend System Design Patterns
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-50">
              Whiteboard
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
              Scene model → hit test → viewport query → Canvas. Seed thousands of shapes, then
              turn optimizations off to feel the cost.
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">FPS (min / avg)</div>
              <div className="font-mono text-lg font-semibold">
                <span
                  className={
                    fpsHealthy
                      ? "text-emerald-400"
                      : fpsDegraded
                        ? "text-amber-400"
                        : "text-rose-400"
                  }
                >
                  {fps.min}
                </span>
                <span className="text-zinc-600"> / </span>
                <span className="text-zinc-400">{fps.avg}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-3 md:px-6">
        <div className="flex rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
          {TOOLS.map((tool) => {
            const active = snapshot.tool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => engine.setTool(tool.id)}
                className={[
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  active ? "bg-sky-500/15 text-sky-300" : "text-zinc-400 hover:text-zinc-200",
                ].join(" ")}
              >
                {tool.label}
                <span className="ml-2 font-mono text-[10px] text-zinc-600">{tool.hint}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs uppercase tracking-wide text-zinc-500">Seed</span>
          {SEEDS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => engine.seed(count)}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
            >
              {count.toLocaleString()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => engine.fit()}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => engine.clear()}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800"
          >
            Clear
          </button>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3 text-sm">
          <Toggle
            label="Viewport culling"
            checked={snapshot.options.culling}
            onChange={(value) => engine.setOption("culling", value)}
          />
          <Toggle
            label="Spatial index"
            checked={snapshot.options.spatialIndex}
            onChange={(value) => engine.setOption("spatialIndex", value)}
          />
          <Toggle
            label="rAF"
            checked={snapshot.options.useRaf}
            onChange={(value) => engine.setOption("useRaf", value)}
          />
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ cursor: snapshot.cursor }}
        />
        {snapshot.shapeCount === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-400">
              Draw a rectangle, or seed 10 shapes to start.
            </p>
          </div>
        )}
      </div>

      <footer className="grid gap-3 border-t border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm sm:grid-cols-4 md:px-6">
        <Metric
          label="Shapes"
          value={`${snapshot.visibleCount.toLocaleString()} visible / ${snapshot.shapeCount.toLocaleString()}`}
        />
        <Metric label="Hit tests" value={snapshot.lastHitTests.toLocaleString()} />
        <Metric label="Zoom" value={`${Math.round(snapshot.zoom * 100)}%`} />
        <Metric
          label="Selection"
          value={snapshot.selectedId ?? "none"}
        />
      </footer>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-zinc-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="rounded border-zinc-600 bg-zinc-900 text-sky-500"
      />
      {label}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="truncate font-mono text-sm font-semibold text-zinc-100">{value}</div>
    </div>
  );
}
