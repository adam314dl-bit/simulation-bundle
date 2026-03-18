import type { ViewportState } from './types';

export class Viewport implements ViewportState {
  scale = 1;
  tx = 0;
  ty = 0;
  dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

  // Momentum state
  private vx = 0;
  private vy = 0;
  private readonly DAMPING = 0.92;
  private readonly MIN_VELOCITY = 0.01;

  screenToWorld(sx: number, sy: number): [number, number] {
    return [(sx - this.tx) / this.scale, (sy - this.ty) / this.scale];
  }

  worldToScreen(wx: number, wy: number): [number, number] {
    return [wx * this.scale + this.tx, wy * this.scale + this.ty];
  }

  zoomAt(cx: number, cy: number, delta: number): void {
    const factor = delta > 0 ? 1 / 1.08 : 1.08;
    const newScale = Math.max(0.1, Math.min(20, this.scale * factor));
    const ratio = newScale / this.scale;
    this.tx = cx - ratio * (cx - this.tx);
    this.ty = cy - ratio * (cy - this.ty);
    this.scale = newScale;
  }

  pan(dx: number, dy: number): void {
    this.tx += dx;
    this.ty += dy;
  }

  startMomentum(vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
  }

  applyMomentum(): boolean {
    if (Math.abs(this.vx) < this.MIN_VELOCITY && Math.abs(this.vy) < this.MIN_VELOCITY) {
      this.vx = 0;
      this.vy = 0;
      return false;
    }
    this.tx += this.vx;
    this.ty += this.vy;
    this.vx *= this.DAMPING;
    this.vy *= this.DAMPING;
    return true;
  }

  reset(): void {
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this.vx = 0;
    this.vy = 0;
  }
}
