// Example 9 — the same tree answers both questions.
//
// Pointer: queryPoint, then the precise hit test from Part One.
// Frame:   queryRange, then draw only those shapes.

import { QuadtreeNode, type IndexedShape, type Point, type Rect } from "./08-quadtree";

declare function screenToScene(point: Point): Point;
declare function hitTest(point: Point, shape: IndexedShape): boolean;
declare function draw(shape: IndexedShape): void;

const tree = new QuadtreeNode({ x: 0, y: 0, width: 8000, height: 8000 });

function onPointerMove(screenPoint: Point) {
  const point = screenToScene(screenPoint);
  const candidates = tree.queryPoint(point);
  const hit = [...candidates].reverse().find((shape) => hitTest(point, shape)) ?? null;
  void hit;
}

function render(viewport: Rect) {
  const visible = tree.queryRange(viewport);
  for (const shape of visible) draw(shape);
}

void onPointerMove;
void render;
