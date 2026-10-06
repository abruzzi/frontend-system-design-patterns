// Example 5 — hit testing. Canvas has no event.target for a rectangle.
//
// Idea: this is a hitbox check. Pointer vs object, not object vs object.

type Point = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };

function hitTest(point: Point, rect: Rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

const shapes: Rect[] = [];
const point = { x: 120, y: 80 };

// Linear scan is fine for a small scene. Walk from the top of the stack
// so the last-drawn shape wins.
const hit = [...shapes].reverse().find((shape) => hitTest(point, shape));

void hit;

// Rectangle → bounding box
// Circle    → distance from center
// Line      → distance from the segment (with a thicker hit area)
//
// 100,000 shapes × every pointermove is the next problem.
