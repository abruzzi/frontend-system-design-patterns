import type { Bounds, Point, Shape, Viewport } from "./types";

export function screenToScene(point: Point, viewport: Viewport): Point {
  return {
    x: point.x / viewport.zoom + viewport.x,
    y: point.y / viewport.zoom + viewport.y,
  };
}

export function viewportBounds(
  viewport: Viewport,
  screenWidth: number,
  screenHeight: number
): Bounds {
  return {
    x: viewport.x,
    y: viewport.y,
    width: screenWidth / viewport.zoom,
    height: screenHeight / viewport.zoom,
  };
}

export function normalizeBounds(shape: Pick<Shape, "x" | "y" | "width" | "height">): Bounds {
  const x = shape.width < 0 ? shape.x + shape.width : shape.x;
  const y = shape.height < 0 ? shape.y + shape.height : shape.y;
  return {
    x,
    y,
    width: Math.abs(shape.width),
    height: Math.abs(shape.height),
  };
}

export function intersects(a: Bounds, b: Bounds): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
