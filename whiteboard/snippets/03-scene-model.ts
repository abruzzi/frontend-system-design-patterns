// Example 3 — the scene model is the state. Canvas is only the renderer.
//
// Idea: SVG retains elements the browser can address. Canvas just draws
// pixels. So we keep our own document, then paint it.

type Shape = {
  id: string;
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
};

type Scene = {
  shapes: Shape[];
};

type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

const scene: Scene = {
  shapes: [{ id: "a", type: "rectangle", x: 80, y: 60, width: 160, height: 100 }],
};

const viewport: Viewport = { x: 0, y: 0, zoom: 1 };

function render(ctx: CanvasRenderingContext2D, scene: Scene) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const shape of scene.shapes) {
    ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
  }
}

void viewport;
void render;

// Document state (shapes) is separate from view state (zoom, pan, selection).
// Part 2 synchronizes the scene model — not pixels.
