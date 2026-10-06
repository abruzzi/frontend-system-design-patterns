export type Point = {
  x: number;
  y: number;
};

export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Shape = {
  id: string;
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

export type Scene = {
  shapes: Shape[];
};

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type Tool = "select" | "rectangle" | "pan";

export type EngineOptions = {
  culling: boolean;
  spatialIndex: boolean;
  useRaf: boolean;
};

export type EngineSnapshot = {
  tool: Tool;
  options: EngineOptions;
  shapeCount: number;
  visibleCount: number;
  lastHitTests: number;
  selectedId: string | null;
  zoom: number;
  viewport: Viewport;
  cursor: string;
};
