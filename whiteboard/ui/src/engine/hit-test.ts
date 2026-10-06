import { normalizeBounds } from "./coordinates";
import type { Point, Shape } from "./types";

export function hitTestRect(point: Point, shape: Shape): boolean {
  const rect = normalizeBounds(shape);
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}
