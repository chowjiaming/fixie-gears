# Testing Strategy

## Unit tests (priority: highest)

`src/lib/gear/` is pure — target 100% coverage here. A seed test file ships
in `docs/08-seed-code.md`; extend it, don't replace it.

- `calculations.test.ts`
  - Known values: 48/16 on 700×25c → ratio 3.0, gear inches ≈ 79.37,
    development ≈ 6.33 m, gain ratio ≈ 5.93 (170 mm cranks)
  - Gain ratio differs for the same gear inches with 165 vs 175 cranks
  - Speed: 90 rpm on 46/17 700×25c ≈ 30.85 km/h
  - Unset circ: 700×25 circumference still ≈ 2.1112 m
  - `circumferenceMm: 2130` → development = ratio × 2.130; gear inches,
    gain, speed use `D_mm = 2130 / π`; skid patches unchanged vs unset
  - Invalid / out-of-range taped circ falls back to BSD+2×tire
  - Clamping: out-of-range teeth/tire clamp, never throw
  - `snapCrankMm`: 167.5 stays 167.5; 168 → 167.5; 168.75 (tie) → 170
  - `parseWheelSize`: `"650b"` ok; `"650c"` and garbage → `"700c"`
- `chain.test.ts`
  - 46/17 stay 410 → even 98, odd 97, `halfLinkCloser` true
  - 46/17 stay 405 → even 96, odd 97, `halfLinkCloser` false
  - `nearestEvenLinks(97)` → 96; `nearestOddLinks(97)` → 97
  - `nearestEvenLinks(97.5)` → 98; `nearestOddLinks(97.5)` → 97;
    midpoint does not prefer odd (no half-link warn)
- Skid cases: 48/16 → 1; 49/16 → 16; 48/17 → 17; 44/11 → 1
  - Ambi + even ring does **not** double: 48/16 ambi → 1; 46/17 ambi → 17
  - Ambi + odd ring **does** double: 49/16 ambi → 32
- `suggestSkidImprovements`: from 48/16, all suggestions have > 1 patch
  and ≥ 8 patches, sorted by ratio-delta ascending; first is 50/17
  (closest ratio among ≥8). Empty list at a range edge is valid.
- Wheel diameter math for each bead seat size (700c 622, 650b 584, 26in 559)

## Search / saved

- `parseCalculatorSearch({})` → `stay: 410`, no `circ` key
- stay 300 → 350; 500 → 450
- circ 1000 or `"foo"` → no `circ`; `2130` → 2130
- Compare tuple length 6 unchanged; length 7 with 2130 sets circ;
  other lengths discarded
- `formatCompareTuple` is 6 fields without circ, 7 with
- `applySearchPatch` deletes `circ` when set to `undefined`
- Saved: optional `circumferenceMm` round-trips; invalid circ dropped;
  export JSON has no stay; `{ v: 2, setups: [] }` refused

## Component tests (`@solidjs/testing-library` + Vitest)

- `ToothInput`: slider and stepper stay in sync, emit one navigation per
  change
- `MetricCard`: renders formatted value, tooltip opens
- `CadenceTable`: 9 rows, 90 rpm row highlighted, one speed column
- `SkidVisualizer`: renders correct marker count (query SVG circles);
  even-ring ambi stays one color
- Warning state appears for 48/16
- Default calculator shows `98 links` and half-link warning for 46/17 @
  410 mm stay
- Empty circ field omits `circ` from search
- Compare column header: measured circumference field, no chainstay

## Integration tests

- Changing chainring updates URL search params and all metric cards
- Loading a URL with `?chainring=48&cog=16` renders warning state
- Navigating `/` → `/explore` preserves calculator search params,
  including `stay` and `circ` when present
- Bare `/compare` seeds cog±1 extras; a URL with only `c2` stays 2 columns
- Saved setup round-trip: save → reload page → appears in `/saved`
- Import of `{ v: 2, setups: [] }` is rejected
- Unit toggle switches hero/secondary length and cadence column unit

## E2E (optional)

Playwright: share-link flow, preset application, compare deltas.

## Commands

```bash
pnpm test        # vitest
pnpm test:watch
```
