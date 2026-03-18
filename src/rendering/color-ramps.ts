import {
  VIRIDIS_DATA,
  INFERNO_DATA,
  PLASMA_DATA,
  COOLWARM_DATA,
  TERRAIN_DATA,
  CATEGORY10_DATA,
} from './color-ramp-data';

type ColorRampFn = (t: number) => string;

const rampRegistry: Record<string, Uint8Array> = {
  viridis: VIRIDIS_DATA,
  inferno: INFERNO_DATA,
  plasma: PLASMA_DATA,
  coolwarm: COOLWARM_DATA,
  terrain: TERRAIN_DATA,
  category10: CATEGORY10_DATA,
};

function makeRampFn(lut: Uint8Array): ColorRampFn {
  return (t: number): string => {
    const i = Math.max(0, Math.min(255, Math.round(t * 255))) * 4;
    return `rgb(${lut[i]},${lut[i + 1]},${lut[i + 2]})`;
  };
}

export const colorRamps = {
  viridis: makeRampFn(VIRIDIS_DATA),
  inferno: makeRampFn(INFERNO_DATA),
  plasma: makeRampFn(PLASMA_DATA),
  coolwarm: makeRampFn(COOLWARM_DATA),
  terrain: makeRampFn(TERRAIN_DATA),
  category10: makeRampFn(CATEGORY10_DATA),
};

export function getRampLUT(name: string): Uint8Array {
  const lut = rampRegistry[name];
  if (!lut) throw new Error(`Unknown color ramp: ${name}`);
  return lut;
}

export function createColorRamp(
  name: string,
  stops: { position: number; color: [number, number, number] }[],
): ColorRampFn {
  // Sort stops by position
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const lut = new Uint8Array(1024); // 256 * 4

  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    // Find surrounding stops
    let lower = sorted[0]!;
    let upper = sorted[sorted.length - 1]!;
    for (let s = 0; s < sorted.length - 1; s++) {
      if (t >= sorted[s]!.position && t <= sorted[s + 1]!.position) {
        lower = sorted[s]!;
        upper = sorted[s + 1]!;
        break;
      }
    }
    const range = upper.position - lower.position;
    const frac = range === 0 ? 0 : (t - lower.position) / range;
    const idx = i * 4;
    lut[idx] = Math.round(lower.color[0] + frac * (upper.color[0] - lower.color[0]));
    lut[idx + 1] = Math.round(lower.color[1] + frac * (upper.color[1] - lower.color[1]));
    lut[idx + 2] = Math.round(lower.color[2] + frac * (upper.color[2] - lower.color[2]));
    lut[idx + 3] = 255;
  }

  // Register for getRampLUT access
  rampRegistry[name] = lut;

  return makeRampFn(lut);
}
