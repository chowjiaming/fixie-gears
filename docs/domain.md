# Domain math

## Isolation

All functions in `src/lib/gear/` are pure, total, and unit-tested. No
framework imports in that directory. The UI never contains formulas.

## Types

From `src/lib/gear/types.ts`:

```ts
export type WheelSizeId = "700c" | "650b" | "26in";

export interface WheelSpec {
  beadSeatDiameterMm: number;
  tireWidthMm: number;
  circumferenceMm?: number;
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

`rolloutMeters` equals `developmentMeters` so track copy can say
"aka rollout". It is not a sixth metric card.

`circumferenceMm` is optional. **Stay is not on `DrivetrainConfig`.**
Chainstay lives only in URL search (`stay`) and feeds
`chainLength(stayMm, ring, cog)` in `src/lib/gear/chain.ts`. Chain
results are not fields on `DerivedMetrics`.

## Wheel diameter

Unset taped circumference (BSD approximation):

```text
D_mm = beadSeatDiameterMm + 2 × tireWidthMm
C_m  = π × D_mm / 1000
```

700×25c → 622 + 50 = 672 mm. Circumference ≈ 2.1112 m
(`calculations.test.ts`).

When `circumferenceMm` is an integer in `[1800, 2500]`:

```text
C_m  = circumferenceMm / 1000
D_mm = circumferenceMm / π
```

Development, gear inches, speed, and gain follow the taped diameter.
Skid patches ignore circumference. Unparsable or out-of-range values
fall back to BSD+2×width.

## Gear metrics

```text
ratio             = chainringTeeth / cogTeeth
gearInches        = ratio × (D_mm / 25.4)
developmentMeters = ratio × C_m
gainRatio         = (D_mm / 2 / crankLengthMm) × ratio
speedKmh          = cadenceRpm × developmentMeters × 60 / 1000
speedMph          = speedKmh / 1.609344
```

48/16 on 700×25c, 170 mm cranks: ratio 3.0, gear inches ≈ 79.37,
development ≈ 6.33 m, gain ≈ 5.93. 46/17 on the same wheel: 90 rpm ≈
30.85 km/h (`calculations.test.ts`).

Cadence rows are 40, 60, 70, 80, 90, 100, 110, 120, 140 rpm. The table
shows one speed column from the units pref and highlights the row
nearest 90. Those are UI choices, not extra derived fields.

## Chain length

Stay is URL-only, integer 350–450 mm, default 410.
`chainLength(stayMm, ring, cog)` in `src/lib/gear/chain.ts`:

```text
stay_in = stayMm / 25.4
L_in    = 2 × stay_in + (ring + cog) / 4 + 0.5
raw     = L_in / 0.5
```

Parity rounding: `Math.round(raw)`; if the parity is wrong, pick the
neighbor closer to `raw`; **tie → lower**. `halfLinkCloser` is
`|raw − odd| < |raw − even|` (strict). Exact midpoint does not warn.

46/17 at 410 mm stay → even 98, odd 97, warning on. 46/17 at 405 mm →
even 96, odd 97, no warning (`chain.test.ts`).

## Skid patches

```text
base        = cogTeeth / gcd(chainringTeeth, cogTeeth)
skidPatches = base × (ambidextrousSkidder && chainring odd ? 2 : 1)
```

Ambidextrous doubling applies **only when the chainring is odd**
(ADR-005). Even ring + ambi does not change the count.

- 48/16 → 1; 48/16 ambi → still 1
- 49/16 → 16; 49/16 ambi → 32
- 48/17 → 17; 46/17 ambi → 17

Warn when `skidPatches ≤ 2`. Visualizer uses two colors only for two
foot-sets (ambi **and** odd ring). Even-ring ambi copy: "opposite foot
hits the same patches." Patch `i` sits at `i × (360° / skidPatches)`.

`suggestSkidImprovements` searches ±2 teeth on ring and/or cog, keeps
candidates with **more** patches than current, then: if any have ≥ 8
patches, take those and sort by smallest ratio change, then more
patches, then lower ring, then lower cog; else max patches, then
smallest ratio change, same tooth tie-break. Return the top 3. An
empty list is valid.

## Ranges

Clamped or snapped in `parseCalculatorSearch`; never thrown.

- chainring: integer 20–80, default 46
- cog: integer 9–30, default 17
- tire: integer 18–50 mm, default 25
- crank: snap to `{165, 167.5, 170, 172.5, 175}`, default 170; ties
  toward 170. This is a float in the URL — do not `clampInt` it.
- wheel: `"700c" | "650b" | "26in"`; anything else (including `"650c"`)
  → `"700c"`
- ambi: `1` or `"1"` → 1; otherwise 0
- stay: integer 350–450 mm, default 410
- circ: optional integer 1800–2500 mm; missing / garbage / out of
  range → property **absent**

## Presets

`PRESETS` in `src/lib/gear/calculations.ts`. Applying a preset writes
`chainring` and `cog` only.

- Track sprint 52/14
- Track endurance 48/15
- Street all-rounder 46/17
- Hilly city 44/17
- Track 48/14 48/14
