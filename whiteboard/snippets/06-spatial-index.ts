// Example 6 — spatial indexing narrows candidates. It does not replace hit testing.
//
// Idea: query nearby shapes first, then run the precise pointer-vs-shape test.

type Point = { x: number; y: number };
type Shape = { id: string; x: number; y: number; width: number; height: number };

declare function queryNearby(point: Point): Shape[];
declare function hitTest(point: Point, shape: Shape): boolean;

function pickShape(point: Point, shapes: Shape[]) {
  const candidates = queryNearby(point); // quadtree, R-tree, or a grid
  return candidates.find((shape) => hitTest(point, shape)) ?? null;
}

void pickShape;
void (null as unknown as Shape[]);

// Without index: simple, easy to update, O(n) search
// With index:    faster queries, more bookkeeping, must update on move
