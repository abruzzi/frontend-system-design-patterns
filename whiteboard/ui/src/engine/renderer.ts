import { normalizeBounds, viewportBounds } from "./coordinates";
import type { Bounds, Shape, Viewport } from "./types";

function gridStep(zoom: number): number {
  if (zoom < 0.2) return 800;
  if (zoom < 0.4) return 400;
  if (zoom < 0.8) return 200;
  return 100;
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  args: {
    shapes: Shape[];
    viewport: Viewport;
    cssWidth: number;
    cssHeight: number;
    dpr: number;
    selectedId: string | null;
    hoveredId: string | null;
    draft: Bounds | null;
  }
) {
  const { viewport, cssWidth, cssHeight, dpr } = args;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  ctx.setTransform(
    dpr * viewport.zoom,
    0,
    0,
    dpr * viewport.zoom,
    -viewport.x * dpr * viewport.zoom,
    -viewport.y * dpr * viewport.zoom
  );

  const view = viewportBounds(viewport, cssWidth, cssHeight);
  drawGrid(ctx, view, viewport.zoom);

  for (const shape of args.shapes) {
    const rect = normalizeBounds(shape);
    ctx.fillStyle = shape.fill;
    ctx.globalAlpha = 0.72;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1 / viewport.zoom;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  }

  const outlineId = args.selectedId ?? args.hoveredId;
  if (outlineId) {
    const outlined = args.shapes.find((shape) => shape.id === outlineId);
    if (outlined) {
      const rect = normalizeBounds(outlined);
      ctx.strokeStyle = args.selectedId === outlineId ? "#38bdf8" : "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2 / viewport.zoom;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
  }

  if (args.draft) {
    ctx.strokeStyle = "#38bdf8";
    ctx.setLineDash([6 / viewport.zoom, 4 / viewport.zoom]);
    ctx.lineWidth = 1.5 / viewport.zoom;
    ctx.strokeRect(args.draft.x, args.draft.y, args.draft.width, args.draft.height);
    ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
    ctx.fillRect(args.draft.x, args.draft.y, args.draft.width, args.draft.height);
    ctx.setLineDash([]);
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, view: Bounds, zoom: number) {
  const step = gridStep(zoom);
  const startX = Math.floor(view.x / step) * step;
  const startY = Math.floor(view.y / step) * step;
  const endX = view.x + view.width;
  const endY = view.y + view.height;

  ctx.beginPath();
  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1 / zoom;

  for (let x = startX; x <= endX; x += step) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y += step) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();
}
