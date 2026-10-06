import type { Shape } from "./types";

const PALETTE = [
  "#38bdf8",
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#fb7185",
  "#a78bfa",
  "#2dd4bf",
];

export const WORLD = { width: 12_000, height: 9_000 };

function spreadFor(count: number) {
  if (count <= 10) return { width: 1_100, height: 640 };
  if (count <= 1_000) return { width: 4_000, height: 2_800 };
  return WORLD;
}

export function seedShapes(count: number): Shape[] {
  const spread = spreadFor(count);
  const shapes: Shape[] = new Array(count);
  for (let i = 0; i < count; i++) {
    shapes[i] = {
      id: `s-${i}`,
      type: "rectangle",
      x: 60 + Math.random() * spread.width,
      y: 60 + Math.random() * spread.height,
      width: 24 + Math.random() * 80,
      height: 24 + Math.random() * 80,
      fill: PALETTE[i % PALETTE.length],
    };
  }
  return shapes;
}

export function nextFill(index: number): string {
  return PALETTE[index % PALETTE.length];
}
