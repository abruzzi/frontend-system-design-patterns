import { normalizeBounds } from "./coordinates";
import type { Bounds, Shape } from "./types";

function cellKey(i: number, j: number): string {
  return `${i}:${j}`;
}

export class SpatialHash {
  private cells = new Map<string, Set<string>>();
  private shapes = new Map<string, Shape>();

  constructor(private cellSize = 256) {}

  clear() {
    this.cells.clear();
    this.shapes.clear();
  }

  rebuild(shapes: Shape[]) {
    this.clear();
    for (const shape of shapes) {
      this.insert(shape);
    }
  }

  insert(shape: Shape) {
    this.remove(shape.id);
    this.shapes.set(shape.id, shape);
    for (const key of this.keysFor(normalizeBounds(shape))) {
      let cell = this.cells.get(key);
      if (!cell) {
        cell = new Set();
        this.cells.set(key, cell);
      }
      cell.add(shape.id);
    }
  }

  remove(id: string) {
    const existing = this.shapes.get(id);
    if (!existing) return;
    for (const key of this.keysFor(normalizeBounds(existing))) {
      this.cells.get(key)?.delete(id);
    }
    this.shapes.delete(id);
  }

  query(bounds: Bounds): Shape[] {
    const ids = new Set<string>();
    for (const key of this.keysFor(bounds)) {
      const cell = this.cells.get(key);
      if (!cell) continue;
      for (const id of cell) ids.add(id);
    }

    const result: Shape[] = [];
    for (const id of ids) {
      const shape = this.shapes.get(id);
      if (shape) result.push(shape);
    }
    return result;
  }

  private keysFor(bounds: Bounds): string[] {
    const minI = Math.floor(bounds.x / this.cellSize);
    const minJ = Math.floor(bounds.y / this.cellSize);
    const maxI = Math.floor((bounds.x + Math.max(bounds.width, 1)) / this.cellSize);
    const maxJ = Math.floor((bounds.y + Math.max(bounds.height, 1)) / this.cellSize);

    const keys: string[] = [];
    for (let i = minI; i <= maxI; i++) {
      for (let j = minJ; j <= maxJ; j++) {
        keys.push(cellKey(i, j));
      }
    }
    return keys;
  }
}
