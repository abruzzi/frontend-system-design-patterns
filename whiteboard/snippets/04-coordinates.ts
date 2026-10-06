// Example 4 — screen coordinates are not scene coordinates.
//
// Idea: the pointer reports pixels on the canvas. After pan + zoom, those
// pixels map to a different place in the document.

type Point = { x: number; y: number };
type Viewport = { x: number; y: number; zoom: number };

function screenToScene(point: Point, viewport: Viewport): Point {
  return {
    x: point.x / viewport.zoom + viewport.x,
    y: point.y / viewport.zoom + viewport.y,
  };
}

const screen = { x: 400, y: 200 };
const viewport = { x: 800, y: 500, zoom: 0.5 };

const scene = screenToScene(screen, viewport);
// scene.x === 1600
// scene.y === 900

void scene;

// screen coordinates
//        ↓
// inverse viewport transform
//        ↓
// scene coordinates
