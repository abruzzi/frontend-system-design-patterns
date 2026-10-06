import { clamp, intersects, normalizeBounds, screenToScene, viewportBounds } from "./coordinates";
import { hitTestRect } from "./hit-test";
import { drawScene } from "./renderer";
import { nextFill, seedShapes } from "./seed";
import { SpatialHash } from "./spatial-hash";
import type {
  EngineOptions,
  EngineSnapshot,
  Point,
  Shape,
  Tool,
  Viewport,
} from "./types";

type Interaction =
  | { type: "idle" }
  | { type: "drawing"; start: Point; current: Point }
  | {
      type: "dragging";
      id: string;
      startScene: Point;
      current: Point;
      originX: number;
      originY: number;
    }
  | { type: "panning"; startScreen: Point; startViewport: Viewport };

export class WhiteboardEngine {
  scene = { shapes: [] as Shape[] };
  viewport: Viewport = { x: 0, y: 0, zoom: 1 };
  tool: Tool = "select";
  options: EngineOptions = {
    culling: true,
    spatialIndex: true,
    useRaf: true,
  };
  spaceDown = false;

  private selectedId: string | null = null;
  private hoveredId: string | null = null;
  private interaction: Interaction = { type: "idle" };
  private index = new SpatialHash(256);
  private z = new Map<string, number>();
  private lastHitTests = 0;
  private visibleCount = 0;
  private created = 0;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private cssWidth = 1;
  private cssHeight = 1;
  private dpr = 1;
  private rafId = 0;
  private resizeObserver: ResizeObserver | null = null;

  private listeners = new Set<() => void>();
  private lastNotify = 0;
  private snapshot: EngineSnapshot;

  constructor() {
    this.snapshot = this.buildSnapshot();
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    const parent = canvas.parentElement;
    if (parent) {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(parent);
    }
    this.resize();
    this.markDirty();

    return () => {
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = 0;
      this.canvas = null;
      this.ctx = null;
    };
  }

  setTool(tool: Tool) {
    this.tool = tool;
    if (tool !== "select") this.hoveredId = null;
    this.notify();
    this.markDirty();
  }

  setSpaceDown(down: boolean) {
    if (this.spaceDown === down) return;
    this.spaceDown = down;
    this.notify();
  }

  setOption<K extends keyof EngineOptions>(key: K, value: EngineOptions[K]) {
    this.options[key] = value;
    if (key === "spatialIndex") {
      if (value) this.index.rebuild(this.scene.shapes);
      else this.index.clear();
    }
    this.notify();
    this.markDirty();
  }

  seed(count: number) {
    this.scene.shapes = seedShapes(count);
    this.created = count;
    this.selectedId = null;
    this.hoveredId = null;
    this.interaction = { type: "idle" };
    this.rebuildZ();
    if (this.options.spatialIndex) this.index.rebuild(this.scene.shapes);
    else this.index.clear();
    this.fit();
  }

  clear() {
    this.scene.shapes = [];
    this.created = 0;
    this.selectedId = null;
    this.hoveredId = null;
    this.interaction = { type: "idle" };
    this.z.clear();
    this.index.clear();
    this.viewport = { x: 0, y: 0, zoom: 1 };
    this.renderNow();
    this.notify();
  }

  fit() {
    if (this.scene.shapes.length === 0) {
      this.viewport = { x: 0, y: 0, zoom: 1 };
      this.renderNow();
      this.notify();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const shape of this.scene.shapes) {
      const rect = normalizeBounds(shape);
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    }

    const padding = 80;
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const zoom = clamp(
      Math.min(this.cssWidth / (width + padding * 2), this.cssHeight / (height + padding * 2)),
      0.04,
      2
    );

    this.viewport = {
      zoom,
      x: minX - (this.cssWidth / zoom - width) / 2,
      y: minY - (this.cssHeight / zoom - height) / 2,
    };
    this.renderNow();
    this.notify();
  }

  deleteSelected() {
    if (!this.selectedId) return;
    const id = this.selectedId;
    this.scene.shapes = this.scene.shapes.filter((shape) => shape.id !== id);
    this.index.remove(id);
    this.selectedId = null;
    this.hoveredId = null;
    this.rebuildZ();
    this.notify();
    this.markDirty();
  }

  pointerDown(event: PointerEvent) {
    const screen = this.screenPoint(event);
    const scene = screenToScene(screen, this.viewport);
    this.canvas?.setPointerCapture(event.pointerId);

    if (this.tool === "pan" || this.spaceDown || event.button === 1) {
      this.interaction = {
        type: "panning",
        startScreen: screen,
        startViewport: { ...this.viewport },
      };
      this.notify();
      return;
    }

    if (this.tool === "rectangle") {
      this.interaction = { type: "drawing", start: scene, current: scene };
      this.selectedId = null;
      this.notify();
      this.markDirty();
      return;
    }

    const hit = this.hitTest(scene);
    this.lastHitTests = hit.tests;
    this.selectedId = hit.shape?.id ?? null;
    this.hoveredId = this.selectedId;

    if (hit.shape) {
      this.interaction = {
        type: "dragging",
        id: hit.shape.id,
        startScene: scene,
        current: scene,
        originX: hit.shape.x,
        originY: hit.shape.y,
      };
    } else {
      this.interaction = { type: "idle" };
    }

    this.notify();
    this.markDirty();
  }

  pointerMove(event: PointerEvent) {
    const screen = this.screenPoint(event);
    const scene = screenToScene(screen, this.viewport);

    if (this.interaction.type === "panning") {
      const dx = (screen.x - this.interaction.startScreen.x) / this.viewport.zoom;
      const dy = (screen.y - this.interaction.startScreen.y) / this.viewport.zoom;
      this.viewport = {
        ...this.viewport,
        x: this.interaction.startViewport.x - dx,
        y: this.interaction.startViewport.y - dy,
      };
      this.markDirty();
      this.notifyThrottled();
      return;
    }

    if (this.interaction.type === "drawing") {
      this.interaction = { ...this.interaction, current: scene };
      this.markDirty();
      return;
    }

    if (this.interaction.type === "dragging") {
      this.interaction = { ...this.interaction, current: scene };
      this.markDirty();
      return;
    }

    if (this.tool === "select") {
      const hit = this.hitTest(scene);
      this.lastHitTests = hit.tests;
      const nextId = hit.shape?.id ?? null;
      if (nextId !== this.hoveredId) {
        this.hoveredId = nextId;
        this.markDirty();
      }
      this.notifyThrottled();
    }
  }

  pointerUp() {
    if (this.interaction.type === "drawing") {
      const draft = normalizeBounds({
        x: this.interaction.start.x,
        y: this.interaction.start.y,
        width: this.interaction.current.x - this.interaction.start.x,
        height: this.interaction.current.y - this.interaction.start.y,
      });

      if (draft.width >= 4 && draft.height >= 4) {
        const shape: Shape = {
          id: `drawn-${this.created++}`,
          type: "rectangle",
          x: draft.x,
          y: draft.y,
          width: draft.width,
          height: draft.height,
          fill: nextFill(this.created),
        };
        this.scene.shapes.push(shape);
        this.z.set(shape.id, this.scene.shapes.length - 1);
        if (this.options.spatialIndex) this.index.insert(shape);
        this.selectedId = shape.id;
      }
    }

    if (this.interaction.type === "dragging") {
      const drag = this.interaction;
      const dx = drag.current.x - drag.startScene.x;
      const dy = drag.current.y - drag.startScene.y;
      const shape = this.scene.shapes.find((item) => item.id === drag.id);
      if (shape && (dx !== 0 || dy !== 0)) {
        this.index.remove(shape.id);
        shape.x = drag.originX + dx;
        shape.y = drag.originY + dy;
        if (this.options.spatialIndex) this.index.insert(shape);
      }
    }

    this.interaction = { type: "idle" };
    this.renderNow();
    this.notify();
  }

  wheel(event: WheelEvent) {
    event.preventDefault();
    const screen = this.screenPoint(event);
    const sceneBefore = screenToScene(screen, this.viewport);
    const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    const zoom = clamp(this.viewport.zoom * factor, 0.04, 8);
    this.viewport = {
      zoom,
      x: sceneBefore.x - screen.x / zoom,
      y: sceneBefore.y - screen.y / zoom,
    };
    this.markDirty();
    this.notifyThrottled();
  }

  private hitTest(point: Point): { shape: Shape | null; tests: number } {
    if (this.options.spatialIndex) {
      const candidates = this.index.query({
        x: point.x,
        y: point.y,
        width: 1,
        height: 1,
      });
      candidates.sort((a, b) => (this.z.get(b.id) ?? 0) - (this.z.get(a.id) ?? 0));
      let tests = 0;
      for (const shape of candidates) {
        tests += 1;
        if (hitTestRect(point, shape)) return { shape, tests };
      }
      return { shape: null, tests };
    }

    let tests = 0;
    for (let i = this.scene.shapes.length - 1; i >= 0; i--) {
      tests += 1;
      const shape = this.scene.shapes[i];
      if (hitTestRect(point, shape)) return { shape, tests };
    }
    return { shape: null, tests };
  }

  private queryVisible(): Shape[] {
    if (!this.options.culling) return this.scene.shapes;

    const view = viewportBounds(this.viewport, this.cssWidth, this.cssHeight);
    const candidates = this.options.spatialIndex
      ? this.index.query(view)
      : this.scene.shapes;

    return candidates.filter((shape) => intersects(normalizeBounds(shape), view));
  }

  private applyTransient(shapes: Shape[]): Shape[] {
    if (this.interaction.type !== "dragging") return shapes;

    const dx = this.interaction.current.x - this.interaction.startScene.x;
    const dy = this.interaction.current.y - this.interaction.startScene.y;
    const { id, originX, originY } = this.interaction;
    let found = false;

    const next = shapes.map((shape) => {
      if (shape.id !== id) return shape;
      found = true;
      return { ...shape, x: originX + dx, y: originY + dy };
    });

    if (!found) {
      const original = this.scene.shapes.find((shape) => shape.id === id);
      if (original) next.push({ ...original, x: originX + dx, y: originY + dy });
    }

    return next;
  }

  private draftBounds() {
    if (this.interaction.type !== "drawing") return null;
    return normalizeBounds({
      x: this.interaction.start.x,
      y: this.interaction.start.y,
      width: this.interaction.current.x - this.interaction.start.x,
      height: this.interaction.current.y - this.interaction.start.y,
    });
  }

  private markDirty() {
    if (!this.options.useRaf) {
      this.renderNow();
      return;
    }
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.renderNow();
    });
  }

  private renderNow() {
    if (!this.ctx || !this.canvas) return;
    const visible = this.applyTransient(this.queryVisible());
    this.visibleCount = visible.length;
    drawScene(this.ctx, {
      shapes: visible,
      viewport: this.viewport,
      cssWidth: this.cssWidth,
      cssHeight: this.cssHeight,
      dpr: this.dpr,
      selectedId: this.selectedId,
      hoveredId: this.hoveredId,
      draft: this.draftBounds(),
    });

    if (this.snapshot.visibleCount !== this.visibleCount) {
      this.notifyThrottled();
    }
  }

  private resize() {
    const canvas = this.canvas;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const rect = parent.getBoundingClientRect();
    this.cssWidth = Math.max(1, rect.width);
    this.cssHeight = Math.max(1, rect.height);
    this.dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(this.cssWidth * this.dpr);
    canvas.height = Math.floor(this.cssHeight * this.dpr);
    canvas.style.width = `${this.cssWidth}px`;
    canvas.style.height = `${this.cssHeight}px`;
    this.markDirty();
  }

  private screenPoint(event: { clientX: number; clientY: number }): Point {
    const rect = this.canvas?.getBoundingClientRect();
    return {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    };
  }

  private rebuildZ() {
    this.z.clear();
    this.scene.shapes.forEach((shape, index) => {
      this.z.set(shape.id, index);
    });
  }

  private cursor(): string {
    if (this.interaction.type === "panning" || this.interaction.type === "dragging") {
      return "grabbing";
    }
    if (this.spaceDown || this.tool === "pan") return "grab";
    if (this.tool === "rectangle") return "crosshair";
    return "default";
  }

  private buildSnapshot(): EngineSnapshot {
    return {
      tool: this.tool,
      options: { ...this.options },
      shapeCount: this.scene.shapes.length,
      visibleCount: this.visibleCount,
      lastHitTests: this.lastHitTests,
      selectedId: this.selectedId,
      zoom: this.viewport.zoom,
      viewport: { ...this.viewport },
      cursor: this.cursor(),
    };
  }

  private notify() {
    this.lastNotify = performance.now();
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) listener();
  }

  private notifyThrottled() {
    if (performance.now() - this.lastNotify < 200) return;
    this.notify();
  }
}
