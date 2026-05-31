import type { ProcessingMode } from "../types/log";

const MODES: { id: ProcessingMode; label: string; description: string }[] = [
  {
    id: "naive-main",
    label: "Naive main thread",
    description: "Filter on every keystroke — expect input lag",
  },
  {
    id: "debounced-main",
    label: "Debounced main thread",
    description: "Typing feels smooth, but UI hitches after you stop",
  },
  {
    id: "worker",
    label: "Debounced + Web Worker",
    description: "Heavy work off the main thread — UI stays at 60fps",
  },
];

interface ProcessingModeToggleProps {
  mode: ProcessingMode;
  onChange: (mode: ProcessingMode) => void;
}

export function ProcessingModeToggle({
  mode,
  onChange,
}: ProcessingModeToggleProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {MODES.map((item) => {
        const active = item.id === mode;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={[
              "rounded-xl border px-4 py-3 text-left transition",
              active
                ? "border-sky-500/60 bg-sky-500/10 ring-1 ring-sky-500/30"
                : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700",
            ].join(" ")}
          >
            <div className="font-medium text-zinc-100">{item.label}</div>
            <div className="mt-1 text-xs leading-relaxed text-zinc-400">
              {item.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
