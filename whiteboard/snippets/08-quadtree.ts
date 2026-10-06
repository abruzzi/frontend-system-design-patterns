// Example 8 — Quadtree insert and split.
//
// A shape that fits in one child goes there.
// A shape that straddles the split stays on the parent.

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type IndexedShape = { id: string; bounds: Rect };

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function rectContainsRect(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

export function pointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x < rect.x + rect.width &&
    point.y >= rect.y &&
    point.y < rect.y + rect.height
  );
}

export class QuadtreeNode {
  objects: IndexedShape[] = [];
  children: QuadtreeNode[] | null = null;

  constructor(
    public bounds: Rect,
    public capacity = 8,
    public maxDepth = 6,
    public depth = 0
  ) {}

  insert(shape: IndexedShape): boolean {
    if (!rectsOverlap(shape.bounds, this.bounds)) return false;

    if (this.children) {
      const child = this.children.find((node) =>
        rectContainsRect(node.bounds, shape.bounds)
      );
      if (child) return child.insert(shape);
      this.objects.push(shape);
      return true;
    }

    this.objects.push(shape);
    if (this.objects.length > this.capacity && this.depth < this.maxDepth) {
      this.subdivide();
    }
    return true;
  }

  queryPoint(point: Point, found: IndexedShape[] = []): IndexedShape[] {
    if (!pointInRect(point, this.bounds)) return found;

    for (const shape of this.objects) {
      if (pointInRect(point, shape.bounds)) found.push(shape);
    }

    if (this.children) {
      const child = this.children.find((node) => pointInRect(point, node.bounds));
      child?.queryPoint(point, found);
    }

    return found;
  }

  queryRange(range: Rect, found: IndexedShape[] = []): IndexedShape[] {
    if (!rectsOverlap(this.bounds, range)) return found;

    for (const shape of this.objects) {
      if (rectsOverlap(shape.bounds, range)) found.push(shape);
    }

    if (this.children) {
      for (const child of this.children) child.queryRange(range, found);
    }

    return found;
  }

  private subdivide(): void {
    const { x, y, width, height } = this.bounds;
    const hw = width / 2;
    const hh = height / 2;
    const next = this.depth + 1;

    this.children = [
      new QuadtreeNode({ x, y, width: hw, height: hh }, this.capacity, this.maxDepth, next),
      new QuadtreeNode({ x: x + hw, y, width: hw, height: hh }, this.capacity, this.maxDepth, next),
      new QuadtreeNode({ x, y: y + hh, width: hw, height: hh }, this.capacity, this.maxDepth, next),
      new QuadtreeNode({ x: x + hw, y: y + hh, width: hw, height: hh }, this.capacity, this.maxDepth, next),
    ];

    const pending = this.objects;
    this.objects = [];
    for (const shape of pending) this.insert(shape);
  }
}
