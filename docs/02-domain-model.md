# Domain Model & Mathematics

All functions in `src/lib/gear/` are **pure, total, and unit-tested**. No
framework imports allowed in this directory. A reference implementation is
seeded in `docs/08-seed-code.md` — copy it verbatim (it already matches this
document).

## Core types

```ts
// lib/gear/types.ts
export type WheelSizeId = "700c" | "650b" | "26in";

export interface WheelSpec {
  beadSeatDiameterMm: number; // 622 (700c/29"), 584 (650b), 559 (26")
  tireWidthMm: number; // 18–50
}

export interface DrivetrainConfig {
  chainringTeeth: number; // 20–80
  cogTeeth: number; // 9–30
  wheel: WheelSpec;
  crankLengthMm: number; // 165 | 167.5 | 170 | 172.5 | 175
  ambidextrousSkidder: boolean;
}

export interface DerivedMetrics {
  ratio: number; // chainring / cog
  gearInches: number; // ratio × wheel diameter (in)
  developmentMeters: number; // ratio × wheel circumference (m)
  gainRatio: number; // (wheel radius / crank length) × ratio
  rolloutMeters: number; // === developmentMeters (track alias; not a card)
  wheelDiameterMm: number;
  skidPatches: number;
  speeds: SpeedRow[]; // speed at standard cadences
}

export interface SpeedRow {
  cadenceRpm: number;
  speedKmh: number;
  speedMph: number;
}
```

`rolloutMeters` is kept on the type so track-racing copy can say “aka
rollout” in the development tooltip. It is **not** a sixth metric card.

## Formulas

Let `R = chainringTeeth / cogTeeth`, `D` = wheel diameter, `C` = wheel
circumference.

### Wheel diameter

```text
D_mm = beadSeatDiameterMm + 2 × tireWidthMm
D_in = D_mm / 25.4
C_m  = π × D_mm / 1000
```

Example: 700×25c → 622 + 50 = 672 mm ≈ 26.46 in.

This is the common calculator approximation; a taped tire is typically
smaller. Say so in the diameter / development tooltip. No measured-
circumference override in v1.

### Gear metrics

```text
ratio             = chainringTeeth / cogTeeth
gearInches        = ratio × D_in
developmentMeters = ratio × C_m
gainRatio         = (D_mm / 2 / crankLengthMm) × ratio
```

Gain ratio (Sheldon Brown) normalizes for crank length — two setups with
equal gear inches but different cranks feel different; gain ratio captures
that.

### Speed at cadence

```text
speedKmh = cadenceRpm × developmentMeters × 60 / 1000
speedMph = speedKmh / 1.609344
```

Standard cadence rows: 40, 60, 70, 80, 90, 100, 110, 120, 140 rpm.
Highlight the row nearest 90 rpm (common cruising cadence). The table shows
**one** speed column, following the units toggle (km/h or mph).

### Skid patches

A skid patch is a spot on the tire that contacts the road when skidding with
the cranks locked in a fixed position.

```text
base        = cogTeeth / gcd(chainringTeeth, cogTeeth)
skidPatches = base × (ambidextrousSkidder && chainringTeeth is odd ? 2 : 1)
```

Ambidextrous doubling applies **only when the chainring is odd**. An even
ring puts the opposite foot on the same contact patches, so the count does
not change. (ADR-005.)

Examples:

- 48/16 → gcd 16 → **1 skid patch** (worst case; tire destroyed quickly)
- 48/16, ambidextrous → still **1** (even ring)
- 49/16 → gcd 1 → **16 skid patches**
- 49/16, ambidextrous → **32** (odd ring)
- 48/17 → gcd 1 → **17 skid patches**
- 46/17, ambidextrous → **17** (even ring; does **not** double)

Design rule: surface a warning when `skidPatches ≤ 2`.

### Skid suggestions

`suggestSkidImprovements(config)` searches ±2 teeth on chainring and/or cog,
keeps candidates with **more** patches than current, then ranks:

1. If any candidate has **≥ 8** patches, take those and sort by **smallest
   ratio change**, then more patches, then lower chainring, then lower cog.
2. Else sort remaining by **max patches**, then smallest ratio change, then
   the same tooth tie-break.

Return the top 3. An empty list is valid (already high patches, or at a
range edge). Do not widen the search to fill the slot.

Worked example: 48/16 (1 patch, ratio 3.0). Both 49/16 (~2% ratio change,
16 patches) and 48/17 (~6%, 17 patches) clear the ≥8 bar; 50/17 is even
closer in ratio (~2%, 17 patches) and wins first place. Classic “add one
tooth to the ring” is nearby, not forced to #1.

### Skid patch geometry (for the visualizer)

Patch `i` sits at angle `θ_i = i × (360° / skidPatches)` around the tire
circumference. The visualizer renders a circle with evenly spaced markers.

Two colors mean **two distinct foot-sets**, not that the ambi toggle is on:

- Ambidextrous **and** odd chainring: two colors, RFF / LFF interleaved.
- Otherwise: one color. If ambi is on and the ring is even, show copy:
  “opposite foot hits the same patches.”

## Validation rules

URL params outside the allowed set are clamped or snapped, never thrown.

- chainringTeeth: integer 20–80 (`clampInt`, default 46)
- cogTeeth: integer 9–30 (`clampInt`, default 17)
- tireWidthMm: integer 18–50 (`clampInt`, default 25)
- crankLengthMm: snap to `{165, 167.5, 170, 172.5, 175}` (`snapCrankMm`,
  default 170). Ties (equal distance to two allowed values) resolve toward
  170.
- wheel: `"700c" | "650b" | "26in"`; anything else (including legacy
  `"650c"`) → `"700c"`
- ambi: `1` or anything else → `0`

## Common presets (ship as data)

Named **ring/cog chips**. Applying a preset writes `chainring` and `cog`
only; wheel, tire, crank, and ambi stay put. Chip subtitle is gear inches
on the **current** wheel. Do not claim a gear-inch in the name.

```ts
export const PRESETS = [
  { name: "Track sprint", chainring: 52, cog: 14 },
  { name: "Track endurance", chainring: 48, cog: 15 },
  { name: "Street all-rounder", chainring: 46, cog: 17 },
  { name: "Hilly city", chainring: 44, cog: 17 },
  { name: "Track 48/14", chainring: 48, cog: 14 },
];
```
