// Example 7 — one render per frame, only what is on screen.
//
// Idea: pointermove can fire faster than the display. Keep the latest
// interaction, then paint on requestAnimationFrame. Cull to the viewport.

type Shape = { id: string; x: number; y: number; width: number; height: number };
type Viewport = { x: number; y: number; zoom: number; width: number; height: number };

let latest: { shapes: Shape[]; viewport: Viewport } | null = null;
let raf = 0;

function onPointerMove(scene: { shapes: Shape[]; viewport: Viewport }) {
  latest = scene;
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    if (latest) render(latest);
  });
}

function render({ shapes, viewport }: { shapes: Shape[]; viewport: Viewport }) {
  const visible = queryViewport(viewport); // spatial index → nearby cells
  for (const shape of visible) {
    draw(shape);
  }
}

declare function queryViewport(viewport: Viewport): Shape[];
declare function draw(shape: Shape): void;

void onPointerMove;

// During a drag, keep a transient position and paint that.
// On pointerup, commit the final position to the document.
