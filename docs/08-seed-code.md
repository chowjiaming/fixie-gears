# Seed Code — `src/lib/gear/`

Reference implementation of the pure math layer. Copy these files verbatim,
run `pnpm test`, and confirm green before building any UI.

## `src/lib/gear/types.ts`

```ts
export type WheelSizeId = "700c" | "650b" | "26in";

export interface WheelSpec {
  beadSeatDiameterMm: number;
  tireWidthMm: number;
}

export interface DrivetrainConfig {
  chainringTeeth: number;
  cogTeeth: number;
  wheel: WheelSpec;
  crankLengthMm: number;
  ambidextrousSkidder: boolean;
}

export interface SpeedRow {
  cadenceRpm: number;
  speedKmh: number;
  speedMph: number;
}

export interface DerivedMetrics {
  ratio: number;
  gearInches: number;
  developmentMeters: number;
  gainRatio: number;
  rolloutMeters: number;
  wheelDiameterMm: number;
  skidPatches: number;
  speeds: SpeedRow[];
}
```

## `src/lib/gear/wheels.ts`

```ts
import type { WheelSizeId, WheelSpec } from "./types";

export const WHEEL_SIZES: Record<
  WheelSizeId,
  { label: string; bsdMm: number }
> = {
  "700c": { label: '700c / 29"', bsdMm: 622 },
  "650b": { label: '650b / 27.5"', bsdMm: 584 },
  "26in": { label: '26"', bsdMm: 559 },
};

export function parseWheelSize(value: unknown): WheelSizeId {
  if (value === "700c" || value === "650b" || value === "26in") {
    return value;
  }
  return "700c";
}

export function wheelDiameterMm(wheel: WheelSpec): number {
  return wheel.beadSeatDiameterMm + 2 * wheel.tireWidthMm;
}

export function wheelCircumferenceM(wheel: WheelSpec): number {
  return (Math.PI * wheelDiameterMm(wheel)) / 1000;
}
```

## `src/lib/gear/skid.ts`

```ts
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
```

## `src/lib/gear/calculations.ts`

```ts
import { skidPatchCount } from "./skid";
import type { DerivedMetrics, DrivetrainConfig, SpeedRow } from "./types";
import { wheelCircumferenceM, wheelDiameterMm } from "./wheels";

export const STANDARD_CADENCES = [40, 60, 70, 80, 90, 100, 110, 120, 140];

export const MM_PER_INCH = 25.4;
export const KM_PER_MILE = 1.609344;

export const ALLOWED_CRANKS_MM = [165, 167.5, 170, 172.5, 175] as const;

/** Parse unknown input to an int in [min, max]; fallback when unparsable. */
export function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Snap to a stock crank length. Equal distance to two sizes resolves
 * toward 170 (the default).
 */
export function snapCrankMm(value: unknown, fallback = 170): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  let best = fallback;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const crank of ALLOWED_CRANKS_MM) {
    const dist = Math.abs(crank - n);
    const closerToDefault =
      dist === bestDist && Math.abs(crank - 170) < Math.abs(best - 170);
    if (dist < bestDist || closerToDefault) {
      best = crank;
      bestDist = dist;
    }
  }
  return best;
}

export function gearRatio(chainringTeeth: number, cogTeeth: number): number {
  return chainringTeeth / cogTeeth;
}

export function gearInches(ratio: number, diameterMm: number): number {
  return ratio * (diameterMm / MM_PER_INCH);
}

export function developmentMeters(
  ratio: number,
  circumferenceM: number,
): number {
  return ratio * circumferenceM;
}

export function gainRatio(
  ratio: number,
  diameterMm: number,
  crankLengthMm: number,
): number {
  return (diameterMm / 2 / crankLengthMm) * ratio;
}

export function speedKmh(cadenceRpm: number, developmentM: number): number {
  return (cadenceRpm * developmentM * 60) / 1000;
}

export function kmhToMph(kmh: number): number {
  return kmh / KM_PER_MILE;
}

export function deriveMetrics(config: DrivetrainConfig): DerivedMetrics {
  const ratio = gearRatio(config.chainringTeeth, config.cogTeeth);
  const diameterMm = wheelDiameterMm(config.wheel);
  const circumferenceM = wheelCircumferenceM(config.wheel);
  const development = developmentMeters(ratio, circumferenceM);

  const speeds: SpeedRow[] = STANDARD_CADENCES.map((cadenceRpm) => {
    const kmh = speedKmh(cadenceRpm, development);
    return { cadenceRpm, speedKmh: kmh, speedMph: kmhToMph(kmh) };
  });

  return {
    ratio,
    gearInches: gearInches(ratio, diameterMm),
    developmentMeters: development,
    gainRatio: gainRatio(ratio, diameterMm, config.crankLengthMm),
    rolloutMeters: development,
    wheelDiameterMm: diameterMm,
    skidPatches: skidPatchCount(
      config.chainringTeeth,
      config.cogTeeth,
      config.ambidextrousSkidder,
    ),
    speeds,
  };
}

export const PRESETS = [
  { name: "Track sprint", chainring: 52, cog: 14 },
  { name: "Track endurance", chainring: 48, cog: 15 },
  { name: "Street all-rounder", chainring: 46, cog: 17 },
  { name: "Hilly city", chainring: 44, cog: 17 },
  { name: "Track 48/14", chainring: 48, cog: 14 },
] as const;
```

## `src/lib/gear/calculations.test.ts`

```ts
import { describe, expect, it } from "vitest";

import {
  clampInt,
  deriveMetrics,
  gainRatio,
  snapCrankMm,
  STANDARD_CADENCES,
} from "./calculations";
import {
  gcd,
  GOOD_SKID_PATCHES,
  skidPatchAngles,
  skidPatchCount,
  suggestSkidImprovements,
} from "./skid";
import type { DrivetrainConfig } from "./types";
import {
  parseWheelSize,
  wheelCircumferenceM,
  wheelDiameterMm,
} from "./wheels";

const wheel700x25 = { beadSeatDiameterMm: 622, tireWidthMm: 25 };

const street: DrivetrainConfig = {
  chainringTeeth: 46,
  cogTeeth: 17,
  wheel: wheel700x25,
  crankLengthMm: 170,
  ambidextrousSkidder: false,
};

const track: DrivetrainConfig = {
  ...street,
  chainringTeeth: 48,
  cogTeeth: 16,
};

describe("wheels", () => {
  it("computes diameter from bead seat + tire", () => {
    expect(wheelDiameterMm(wheel700x25)).toBe(672);
    expect(
      wheelDiameterMm({ beadSeatDiameterMm: 584, tireWidthMm: 23 }),
    ).toBe(630);
    expect(
      wheelDiameterMm({ beadSeatDiameterMm: 559, tireWidthMm: 40 }),
    ).toBe(639);
  });

  it("computes circumference in meters", () => {
    expect(wheelCircumferenceM(wheel700x25)).toBeCloseTo(2.1112, 4);
  });

  it("parses wheel size ids", () => {
    expect(parseWheelSize("700c")).toBe("700c");
    expect(parseWheelSize("650b")).toBe("650b");
    expect(parseWheelSize("26in")).toBe("26in");
    expect(parseWheelSize("650c")).toBe("700c");
    expect(parseWheelSize("nope")).toBe("700c");
  });
});

describe("derived metrics", () => {
  it("matches published gear charts for 48/16 on 700x25c", () => {
    const m = deriveMetrics(track);
    expect(m.ratio).toBe(3);
    expect(m.gearInches).toBeCloseTo(79.37, 2);
    expect(m.developmentMeters).toBeCloseTo(6.33, 2);
    expect(m.rolloutMeters).toBe(m.developmentMeters);
    expect(m.gainRatio).toBeCloseTo(5.93, 2);
    expect(m.skidPatches).toBe(1);
  });

  it("computes speed at cadence for 46/17 on 700x25c", () => {
    const m = deriveMetrics(street);
    const row90 = m.speeds.find((r) => r.cadenceRpm === 90);
    expect(row90?.speedKmh).toBeCloseTo(30.85, 2);
    expect(row90?.speedMph).toBeCloseTo(19.17, 2);
  });

  it("emits one speed row per standard cadence", () => {
    const m = deriveMetrics(street);
    expect(m.speeds.map((r) => r.cadenceRpm)).toEqual(STANDARD_CADENCES);
  });

  it("gain ratio responds to crank length at equal gear inches", () => {
    const short = gainRatio(3, 672, 165);
    const long = gainRatio(3, 672, 175);
    expect(short).toBeGreaterThan(long);
  });
});

describe("clampInt", () => {
  it("clamps, rounds, and falls back", () => {
    expect(clampInt(46, 20, 80, 46)).toBe(46);
    expect(clampInt("46", 20, 80, 46)).toBe(46);
    expect(clampInt(999, 20, 80, 46)).toBe(80);
    expect(clampInt(1, 20, 80, 46)).toBe(20);
    expect(clampInt(46.6, 20, 80, 46)).toBe(47);
    expect(clampInt("abc", 20, 80, 46)).toBe(46);
    expect(clampInt(undefined, 20, 80, 46)).toBe(46);
    expect(clampInt(Number.NaN, 20, 80, 46)).toBe(46);
    expect(clampInt(12, 18, 50, 25)).toBe(18);
    expect(clampInt(60, 18, 50, 25)).toBe(50);
  });
});

describe("snapCrankMm", () => {
  it("keeps stock lengths and snaps the rest toward 170 on ties", () => {
    expect(snapCrankMm(167.5)).toBe(167.5);
    expect(snapCrankMm("172.5")).toBe(172.5);
    expect(snapCrankMm(168)).toBe(167.5);
    expect(snapCrankMm(168.75)).toBe(170);
    expect(snapCrankMm(999)).toBe(175);
    expect(snapCrankMm("abc")).toBe(170);
    expect(snapCrankMm(undefined)).toBe(170);
  });
});

describe("skid patches", () => {
  it("computes gcd", () => {
    expect(gcd(48, 16)).toBe(16);
    expect(gcd(49, 16)).toBe(1);
    expect(gcd(44, 11)).toBe(11);
  });

  it("matches known skid patch counts", () => {
    expect(skidPatchCount(48, 16, false)).toBe(1);
    expect(skidPatchCount(49, 16, false)).toBe(16);
    expect(skidPatchCount(48, 17, false)).toBe(17);
    expect(skidPatchCount(44, 11, false)).toBe(1);
  });

  it("doubles ambidextrous only when the chainring is odd", () => {
    expect(skidPatchCount(46, 17, true)).toBe(17);
    expect(skidPatchCount(48, 16, true)).toBe(1);
    expect(skidPatchCount(49, 16, true)).toBe(32);
  });

  it("lays patches out evenly around the wheel", () => {
    expect(skidPatchAngles(4)).toEqual([0, 90, 180, 270]);
    expect(skidPatchAngles(1)).toEqual([0]);
    expect(skidPatchAngles(0)).toEqual([]);
  });
});

describe("suggestSkidImprovements", () => {
  it("only suggests configs with more patches than current", () => {
    const suggestions = suggestSkidImprovements(track); // 48/16 → 1 patch
    expect(suggestions.length).toBe(3);
    for (const s of suggestions) {
      expect(s.skidPatches).toBeGreaterThan(1);
      expect(s.skidPatches).toBeGreaterThanOrEqual(GOOD_SKID_PATCHES);
    }
  });

  it("prefers closest ratio among ≥8-patch neighbors", () => {
    const suggestions = suggestSkidImprovements(track);
    // 50/17 is the smallest ratio delta from 48/16 that still has ≥8 patches.
    expect(suggestions[0]).toMatchObject({
      chainringTeeth: 50,
      cogTeeth: 17,
      skidPatches: 17,
    });
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i - 1]!.ratioDeltaPct).toBeLessThanOrEqual(
        suggestions[i]!.ratioDeltaPct,
      );
    }
  });

  it("stays within valid tooth ranges", () => {
    const edge: DrivetrainConfig = {
      ...street,
      chainringTeeth: 20,
      cogTeeth: 9,
    };
    for (const s of suggestSkidImprovements(edge)) {
      expect(s.chainringTeeth).toBeGreaterThanOrEqual(20);
      expect(s.cogTeeth).toBeGreaterThanOrEqual(9);
    }
  });
});
```
