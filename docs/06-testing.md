# Testing Strategy

## Unit tests (priority: highest)

`src/lib/gear/` is pure — target 100% coverage here. A seed test file ships
in `docs/08-seed-code.md`; extend it, don't replace it.

- `calculations.test.ts`
  - Known values: 48/16 on 700×25c → ratio 3.0, gear inches ≈ 79.37,
    development ≈ 6.33 m, gain ratio ≈ 5.93 (170 mm cranks)
  - Gain ratio differs for the same gear inches with 165 vs 175 cranks
  - Speed: 90 rpm on 46/17 700×25c ≈ 30.85 km/h
  - Clamping: out-of-range teeth/tire clamp, never throw
  - `snapCrankMm`: 167.5 stays 167.5; 168 → 167.5; 168.75 (tie) → 170
  - `parseWheelSize`: `"650b"` ok; `"650c"` and garbage → `"700c"`
- Skid cases: 48/16 → 1; 49/16 → 16; 48/17 → 17; 44/11 → 1
  - Ambi + even ring does **not** double: 48/16 ambi → 1; 46/17 ambi → 17
  - Ambi + odd ring **does** double: 49/16 ambi → 32
- `suggestSkidImprovements`: from 48/16, all suggestions have > 1 patch
  and ≥ 8 patches, sorted by ratio-delta ascending; first is 50/17
  (closest ratio among ≥8). Empty list at a range edge is valid.
- Wheel diameter math for each bead seat size (700c 622, 650b 584, 26in 559)

## Component tests (`@solidjs/testing-library` + Vitest)

- `ToothInput`: slider and stepper stay in sync, emit one navigation per
  change
- `MetricCard`: renders formatted value, tooltip opens
- `CadenceTable`: 9 rows, 90 rpm row highlighted, one speed column
- `SkidVisualizer`: renders correct marker count (query SVG circles);
  even-ring ambi stays one color
- Warning state appears for 48/16

## Integration tests

- Changing chainring updates URL search params and all metric cards
- Loading a URL with `?chainring=48&cog=16` renders warning state
- Navigating `/` → `/explore` preserves calculator search params
- Bare `/compare` seeds cog±1 extras; a URL with only `c2` stays 2 columns
- Saved setup round-trip: save → reload page → appears in `/saved`
- Import of `{ v: 2, setups: [] }` is rejected
- Unit toggle switches hero/secondary length and cadence column unit

## E2E (optional, v1.1)

Playwright: share-link flow, preset application, compare deltas.

## Commands

```bash
npm run test        # vitest
npm run test:watch
```
