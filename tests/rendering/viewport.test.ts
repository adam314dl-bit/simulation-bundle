import { describe, it, expect } from 'vitest';
import { Viewport } from '../../src/rendering/viewport';

describe('Viewport', () => {
  it('screenToWorld returns same coords at identity transform (scale=1, tx=0, ty=0)', () => {
    const vp = new Viewport();
    const [wx, wy] = vp.screenToWorld(100, 200);
    expect(wx).toBe(100);
    expect(wy).toBe(200);
  });

  it('worldToScreen is the inverse of screenToWorld', () => {
    const vp = new Viewport();
    vp.scale = 2;
    vp.tx = 50;
    vp.ty = -30;
    const [wx, wy] = vp.screenToWorld(100, 200);
    const [sx, sy] = vp.worldToScreen(wx, wy);
    expect(sx).toBeCloseTo(100, 10);
    expect(sy).toBeCloseTo(200, 10);
  });

  it('zoomAt keeps point under cursor fixed', () => {
    const vp = new Viewport();
    vp.scale = 1.5;
    vp.tx = 20;
    vp.ty = -10;
    const cx = 150;
    const cy = 250;
    const [beforeX, beforeY] = vp.screenToWorld(cx, cy);
    vp.zoomAt(cx, cy, -1); // zoom in
    const [afterX, afterY] = vp.screenToWorld(cx, cy);
    expect(afterX).toBeCloseTo(beforeX, 8);
    expect(afterY).toBeCloseTo(beforeY, 8);
  });

  it('zoom clamps to [0.1, 20] range — cannot zoom below 0.1', () => {
    const vp = new Viewport();
    vp.scale = 0.1;
    // Zoom out (positive delta)
    vp.zoomAt(0, 0, 1);
    expect(vp.scale).toBeGreaterThanOrEqual(0.1);
  });

  it('zoom clamps to [0.1, 20] range — cannot zoom above 20', () => {
    const vp = new Viewport();
    vp.scale = 20;
    // Zoom in (negative delta)
    vp.zoomAt(0, 0, -1);
    expect(vp.scale).toBeLessThanOrEqual(20);
  });

  it('pan(dx, dy) shifts translation', () => {
    const vp = new Viewport();
    vp.pan(10, -5);
    expect(vp.tx).toBe(10);
    expect(vp.ty).toBe(-5);
    vp.pan(3, 7);
    expect(vp.tx).toBe(13);
    expect(vp.ty).toBe(2);
  });

  it('applyMomentum reduces velocity by damping factor (0.92)', () => {
    const vp = new Viewport();
    vp.startMomentum(10, 10);
    vp.applyMomentum();
    // After one step: tx = 10, velocity should be 10 * 0.92 = 9.2
    // After second step: tx = 10 + 9.2 = 19.2
    const txAfterFirst = vp.tx;
    expect(txAfterFirst).toBe(10);
    vp.applyMomentum();
    expect(vp.tx).toBeCloseTo(19.2, 5);
  });

  it('applyMomentum returns false when velocity is negligible', () => {
    const vp = new Viewport();
    vp.startMomentum(0.005, 0.005);
    const result = vp.applyMomentum();
    expect(result).toBe(false);
  });

  it('reset restores identity transform', () => {
    const vp = new Viewport();
    vp.scale = 5;
    vp.tx = 100;
    vp.ty = -50;
    vp.startMomentum(10, 10);
    vp.reset();
    expect(vp.scale).toBe(1);
    expect(vp.tx).toBe(0);
    expect(vp.ty).toBe(0);
  });
});
