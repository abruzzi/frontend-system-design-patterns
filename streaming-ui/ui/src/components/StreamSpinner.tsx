export function StreamSpinner({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block size-4 shrink-0 rounded-full border-2 border-zinc-600 border-t-sky-400 animate-spin ${className ?? ""}`}
      aria-hidden
    />
  );
}
