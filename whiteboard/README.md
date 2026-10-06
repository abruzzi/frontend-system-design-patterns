# Whiteboard — High-Performance Drawing Canvas

Canvas 2D demo of an Excalidraw / Figma-style scene: a scene model, hit testing, spatial indexing, viewport culling, and frame-aligned rendering.

Companion to the Frontend System Design series on [I Code It](https://www.youtube.com/@icodeit.juntao).

The teaching question splits in three:

- **Part 1:** Can one user manipulate a very large scene smoothly?
- **Part 2:** Can many users manipulate the same scene consistently and still keep it responsive?
- **Part 3:** After the planned two parts — a dedicated deep dive on the spatial index algorithm

This folder is the Part 1 demo. Part 3 uses the same app.

```text
Pointer
   ↓
Coordinate Transform
   ↓
Hit Testing
   ↓
Scene Model
   ↓
Viewport Query
   ↓
Renderer
   ↓
Canvas
```

## Teaching snippets

Plain walkthrough files in [`snippets/`](./snippets/) — not wired into the app:

1. [`01-svg-shapes.html`](./snippets/01-svg-shapes.html) — SVG retains `rect` / `circle` / `line` / `path` as elements
2. [`02-svg-events.js`](./snippets/02-svg-events.js) — `querySelector`, `pointerdown`, `setAttribute`, CSS class
3. [`03-scene-model.ts`](./snippets/03-scene-model.ts) — Canvas is the renderer; the scene is the state
4. [`04-coordinates.ts`](./snippets/04-coordinates.ts) — screen coordinates → inverse viewport → scene coordinates
5. [`05-hit-test.ts`](./snippets/05-hit-test.ts) — pointer-vs-shape, not `event.target`
6. [`06-spatial-index.ts`](./snippets/06-spatial-index.ts) — index narrows candidates; hit testing stays precise
7. [`07-raf-culling.ts`](./snippets/07-raf-culling.ts) — one render per frame, only what is on screen
8. [`08-quadtree.ts`](./snippets/08-quadtree.ts) — insert, subdivide, straddling shapes stay on the parent
9. [`09-quadtree-query.ts`](./snippets/09-quadtree-query.ts) — `queryPoint` on move, `queryRange` on frame

## Run the demo

```bash
# From repo root
npm run setup:whiteboard
npm run dev:whiteboard

# Or from this folder
npm run setup
npm run dev
```

Open [http://localhost:5177](http://localhost:5177).

- **Select / Rectangle / Pan** — click, drag to create, wheel to zoom, space or middle-mouse to pan
- **Seed** — 10 → 1,000 → 10,000 → 100,000 shapes
- Toggle **viewport culling**, **spatial index**, and **rAF** to make the bottleneck visible, then turn the optimizations back on
