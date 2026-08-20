import type { DrivetrainConfig } from "./types";

export const GOOD_SKID_PATCHES = 8;

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

export function skidPatchCount(
  chainringTeeth: number,
  cogTeeth: number,
  ambidextrousSkidder: boolean,
): number {
  const base = cogTeeth / gcd(chainringTeeth, cogTeeth);
  const oddRing = Math.round(chainringTeeth) % 2 === 1;
  return ambidextrousSkidder && oddRing ? base * 2 : base;
}

/** Angles in degrees, one per skid patch, starting at 0 (top of wheel). */
export function skidPatchAngles(patchCount: number): number[] {
  if (patchCount < 1) return [];
  return Array.from({ length: patchCount }, (_, i) => (i * 360) / patchCount);
}

export interface SkidSuggestion {
  chainringTeeth: number;
  cogTeeth: number;
  skidPatches: number;
  /** Relative change in gear ratio vs. current config (0–1). */
  ratioDeltaPct: number;
}

const CHAINRING_RANGE = { min: 20, max: 80 } as const;
const COG_RANGE = { min: 9, max: 30 } as const;

function toothTieBreak(a: SkidSuggestion, b: SkidSuggestion): number {
  return a.chainringTeeth - b.chainringTeeth || a.cogTeeth - b.cogTeeth;
}

/**
 * Nearby configs (±2 teeth on chainring and/or cog) with more skid patches
 * than the current setup. Prefer ≥ GOOD_SKID_PATCHES with smallest ratio
 * change; if none qualify, fall back to max patches then smallest ratio
 * change.
 */
export function suggestSkidImprovements(
  config: DrivetrainConfig,
  count = 3,
): SkidSuggestion[] {
  const current = skidPatchCount(
    config.chainringTeeth,
    config.cogTeeth,
    config.ambidextrousSkidder,
  );
  const currentRatio = config.chainringTeeth / config.cogTeeth;
  const candidates: SkidSuggestion[] = [];

  for (let dRing = -2; dRing <= 2; dRing++) {
    for (let dCog = -2; dCog <= 2; dCog++) {
      if (dRing === 0 && dCog === 0) continue;
      const chainringTeeth = config.chainringTeeth + dRing;
      const cogTeeth = config.cogTeeth + dCog;
      if (
        chainringTeeth < CHAINRING_RANGE.min ||
        chainringTeeth > CHAINRING_RANGE.max ||
        cogTeeth < COG_RANGE.min ||
        cogTeeth > COG_RANGE.max
      ) {
        continue;
      }
      const skidPatches = skidPatchCount(
        chainringTeeth,
        cogTeeth,
        config.ambidextrousSkidder,
      );
      if (skidPatches <= current) continue;
      const ratio = chainringTeeth / cogTeeth;
      candidates.push({
        chainringTeeth,
        cogTeeth,
        skidPatches,
        ratioDeltaPct: Math.abs(ratio - currentRatio) / currentRatio,
      });
    }
  }

  const good = candidates.filter((c) => c.skidPatches >= GOOD_SKID_PATCHES);
  const pool = good.length > 0 ? good : candidates;

  return pool
    .slice()
    .sort((a, b) => {
      if (good.length > 0) {
        return (
          a.ratioDeltaPct - b.ratioDeltaPct ||
          b.skidPatches - a.skidPatches ||
          toothTieBreak(a, b)
        );
      }
      return (
        b.skidPatches - a.skidPatches ||
        a.ratioDeltaPct - b.ratioDeltaPct ||
        toothTieBreak(a, b)
      );
    })
    .slice(0, count);
}
