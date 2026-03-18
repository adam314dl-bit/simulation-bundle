import { describe, it, expect } from 'vitest';
import { colorRamps, getRampLUT, createColorRamp } from '../../src/rendering/color-ramps';

describe('colorRamps', () => {
  it('viridis(0) returns rgb(68,1,84)', () => {
    expect(colorRamps.viridis(0)).toBe('rgb(68,1,84)');
  });

  it('viridis(1) returns rgb(253,231,37)', () => {
    expect(colorRamps.viridis(1)).toBe('rgb(253,231,37)');
  });

  it('viridis(0.5) returns a valid rgb(...) string', () => {
    const color = colorRamps.viridis(0.5);
    expect(color).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });

  it('all 6 ramps exist: viridis, inferno, plasma, coolwarm, terrain, category10', () => {
    expect(typeof colorRamps.viridis).toBe('function');
    expect(typeof colorRamps.inferno).toBe('function');
    expect(typeof colorRamps.plasma).toBe('function');
    expect(typeof colorRamps.coolwarm).toBe('function');
    expect(typeof colorRamps.terrain).toBe('function');
    expect(typeof colorRamps.category10).toBe('function');
  });

  it('inferno boundary values are correct', () => {
    expect(colorRamps.inferno(0)).toBe('rgb(0,0,4)');
    expect(colorRamps.inferno(1)).toBe('rgb(252,255,164)');
  });

  it('plasma boundary values are correct', () => {
    expect(colorRamps.plasma(0)).toBe('rgb(13,8,135)');
    expect(colorRamps.plasma(1)).toBe('rgb(240,249,33)');
  });

  it('coolwarm boundary values are correct', () => {
    expect(colorRamps.coolwarm(0)).toBe('rgb(59,76,192)');
    expect(colorRamps.coolwarm(1)).toBe('rgb(180,4,38)');
  });

  it('terrain boundary values are correct', () => {
    expect(colorRamps.terrain(0)).toBe('rgb(51,51,153)');
    expect(colorRamps.terrain(1)).toBe('rgb(255,255,255)');
  });

  it('values < 0 clamp to 0', () => {
    expect(colorRamps.viridis(-0.5)).toBe(colorRamps.viridis(0));
  });

  it('values > 1 clamp to 1', () => {
    expect(colorRamps.viridis(1.5)).toBe(colorRamps.viridis(1));
  });

  it('category10 maps discrete bins: (0) and (0.09) return same color', () => {
    // category10 has 10 bins of ~25-26 entries each
    // 0 maps to index 0, 0.09 maps to index ~23 — same bin
    expect(colorRamps.category10(0)).toBe(colorRamps.category10(0.09));
  });

  it('category10(0) returns rgb(31,119,180)', () => {
    expect(colorRamps.category10(0)).toBe('rgb(31,119,180)');
  });
});

describe('getRampLUT', () => {
  it('returns Uint8Array of length 1024 for viridis', () => {
    const lut = getRampLUT('viridis');
    expect(lut).toBeInstanceOf(Uint8Array);
    expect(lut.length).toBe(1024);
  });

  it('throws for unknown ramp name', () => {
    expect(() => getRampLUT('nonexistent')).toThrow('Unknown color ramp');
  });
});

describe('createColorRamp', () => {
  it('creates a ramp that maps 0 to start color and 1 to end color', () => {
    const ramp = createColorRamp('test', [
      { position: 0, color: [0, 0, 0] },
      { position: 1, color: [255, 255, 255] },
    ]);
    expect(ramp(0)).toBe('rgb(0,0,0)');
    expect(ramp(1)).toBe('rgb(255,255,255)');
  });

  it('custom ramp is accessible via getRampLUT after creation', () => {
    createColorRamp('custom-test', [
      { position: 0, color: [255, 0, 0] },
      { position: 1, color: [0, 0, 255] },
    ]);
    const lut = getRampLUT('custom-test');
    expect(lut).toBeInstanceOf(Uint8Array);
    expect(lut.length).toBe(1024);
  });

  it('interpolates mid-point correctly for linear black-to-white ramp', () => {
    const ramp = createColorRamp('linear-bw', [
      { position: 0, color: [0, 0, 0] },
      { position: 1, color: [255, 255, 255] },
    ]);
    const mid = ramp(0.5);
    // 0.5 * 255 = 127.5, rounds to 128
    expect(mid).toBe('rgb(128,128,128)');
  });
});
