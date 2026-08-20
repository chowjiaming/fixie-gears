# v2 Calculator (street shop) — Design

Slice **A** of the deferred v2 list: local calculator extensions only.
Not in this spec: PWA, accounts/cloud sync, 650c, free-form cranks,
gear-inch target, track/UCI legality.

**Job:** same as v1 — street fixie at the shop. Chain length and a taped
tire measurement help at the counter.

**Architecture:** parallel modules. `src/lib/gear/chain.ts` owns stay →
links. Optional measured circumference lives on `WheelSpec` and feeds
existing `deriveMetrics`. Chain results are not fields on
`DerivedMetrics`. Search `v` stays `1`.

---

## Out of scope

- PWA / offline-first copy
- User accounts, cloud sync, Netlify functions
- 650c (unknown `wheel`, including `650c`, still parses as `700c`)
- Free-form crank millimetres (still snap to `165 | 167.5 | 170 | 172.5 | 175`)
- Gear-inch target
- Track event ratio legality / dropout-travel slider
- Sixth metric card
- Chain column on `/compare`
- Stay in compare tuples or saved setups

---

## Domain math

### Constants

```ts
export const STAY_MIN_MM = 350;
export const STAY_MAX_MM = 450;
export const STAY_DEFAULT_MM = 410;
export const CIRC_MIN_MM = 1800;
export const CIRC_MAX_MM = 2500;
```

Use existing `MM_PER_INCH = 25.4`.

### Chain (`src/lib/gear/chain.ts`)

Stay is **not** on `DrivetrainConfig`. Pure functions of
`(stayMm, ring, cog)`:

```text
stay_in = stayMm / 25.4
L_in    = 2 × stay_in + (ring + cog) / 4 + 0.5
raw     = L_in / 0.5
```

```ts
export interface ChainLength {
  rawLinks: number;
  evenLinks: number;
  oddLinks: number;
  halfLinkCloser: boolean;
}

export function nearestEvenLinks(raw: number): number;
export function nearestOddLinks(raw: number): number;
export function chainLength(
  stayMm: number,
  ring: number,
  cog: number,
): ChainLength;
```

Parity rounding: `Math.round(raw)`; if the parity is wrong, pick the
neighbor closer to `raw`; **tie → lower**.

`halfLinkCloser` is `|raw − odd| < |raw − even|` (strict). Exact
midpoint does not warn.

UI shows `evenLinks` as the buy number and `oddLinks` as the half-link
option. Warning follows `halfLinkCloser`.

**Seed values (must match tests):**

| stay mm | ring/cog | raw (approx) | even | odd | halfLinkCloser |
| --- | --- | --- | --- | --- | --- |
| 410 | 46/17 | 97.067 | 98 | 97 | true |
| 405 | 46/17 | 96.280 | 96 | 97 | false |
| — | raw 97 exactly | 97 | 96 | 97 | true |
| — | raw 97.5 | 97.5 | 98 | 97 | false |

A bare `/` (46/17, stay 410) **does** show the half-link warning. That is
intentional.

### Circumference (`WheelSpec` + wheels helpers)

```ts
export interface WheelSpec {
  beadSeatDiameterMm: number;
  tireWidthMm: number;
  circumferenceMm?: number;
}
```

`circumferenceMm` is set only when it is an integer in `[1800, 2500]`.

When set:

```text
C_m  = circumferenceMm / 1000
D_mm = circumferenceMm / π
```

`wheelDiameterMm` and `wheelCircumferenceM` use that path. Development,
gear inches, speed, and gain ratio follow. Skid patches ignore
circumference.

When unset, unparsable, or out of range: today’s
`D_mm = BSD + 2 × tireWidth`, `C_m = π × D_mm / 1000`.

Seed literals **without** `circ` stay **2.1112 m** (700×25) and
**30.85 km/h** at 90 rpm on 46/17. With `circ: 2130`, development is
`ratio × 2.130`.

---

## Search, compare, saved

### Calculator search

`v` stays `1`. Old links keep working.

```ts
export interface CalculatorSearch {
  v: 1;
  chainring: number;
  cog: number;
  wheel: WheelSizeId;
  tire: number;
  crank: number;
  ambi: 0 | 1;
  stay: number; // 350–450, default 410
  circ?: number; // 1800–2500 integer mm; omit when unset
}
```

- Missing / garbage `stay` → `410`.
- Missing / garbage / out-of-range `circ` → property **absent** (not `0`).
- Empty `/` does not require `?stay=410` in the URL; the parser supplies
  410. Write `stay` when the rider edits it.
- Clearing the circ field **deletes** `circ` from search (`undefined` in
  the patch must remove the key, not write `circ=0`).
- Navigating between routes spreads `stay` and `circ` (when present).

`toConfig` / `fromConfig` map `circ` ↔ `wheel.circumferenceMm`. Stay is
not on the config object.

### Compare tuples

Column 1 is the live global bike (including `circ`, excluding stay from
the tuple). Stay is global; all columns share it. Compare does **not**
show a chain row.

| parts | meaning |
| --- | --- |
| 6 | `ring,cog,wheel,tire,crank,ambi` — no circ |
| 7 | same plus integer `circ` |
| any other length | discard that extra |

`formatCompareTuple` writes 6 fields unless circ is set, then 7. Compact,
seed, add, remove behavior is unchanged. Seeded cog±1 neighbors copy
column 1’s circ via `formatCompareTuple`.

### Saved setups

Export remains `{ v: 1, setups }`. Unknown `v` is refused.

Optional `config.wheel.circumferenceMm`. If present and valid, keep it;
if present and invalid, **drop that field** and keep the bike. Stay is
not in the file. Loading a setup writes ring/cog/wheel/tire/crank/ambi
and circ (if any); the current URL `stay` is left alone.

---

## UI

Still **five** metric cards. No chain card.

### Calculator inputs

Order: chainring, cog, wheel, tire, **measured circumference**, crank,
**chainstay**, ambi, presets.

- Circumference: optional number input, millimetres, placeholder
  `optional`, `aria-label` `Measured circumference`. Empty clears `circ`.
- Chainstay: `aria-label` `Chainstay`. Metric: millimetre stepper
  350–450. Imperial: 0.1″ steps, URL gets
  `clampInt(round(inches × 25.4), 350, 450, 410)`. Display inches as
  one decimal.

### Tooltips

Unset circ: keep the current approximation sentences on development,
gear inches, and gain.

Set circ: those three tooltips use:

> Using a taped circumference of {n} mm. Clear the field to return to
> bead-seat plus twice the tire width.

### Chain panel

Right column, **after** skid visualizer + Improve this.

- Heading: `Chain`
- Primary value: `{even} links` (`aria-live="polite"`)
- Secondary: `{odd} with a half-link`
- Warning only when `halfLinkCloser`:

  > Even chain won’t tension well. Use a half-link, or change ring or
  > cog by 2 teeth.

- `?` tooltip:

  > Chain length in ½″ links: 2 × chainstay (inches) + (ring + cog) / 4
  > + 0.5, then round. Connecting-pin chains want an even count. An odd
  > count needs a half-link.

### Other routes

- Compare header: compact circ after tire, empty = unset. No stay.
- Explore: no new chrome. Heatmap cells use `deriveMetrics` with the
  current wheel, including `circ` when set.
- Saved: no new chrome.

---

## Errors

Never throw. Stay clamps. Bad circ becomes unset. No new npm
dependencies. Solid 2.0 only. Format/lint with Biome. Domain math has
no framework imports.

---

## Tests

### `src/lib/gear/chain.ts`

- 46/17 stay 410 → even 98, odd 97, `halfLinkCloser` true
- 46/17 stay 405 → even 96, odd 97, `halfLinkCloser` false
- `nearestEvenLinks(97)` → 96; `nearestOddLinks(97)` → 97
- `nearestEvenLinks(97.5)` → 98; `nearestOddLinks(97.5)` → 97;
  `halfLinkCloser` false for that raw pair

### wheels / `deriveMetrics`

- Unset circ: 700×25 circumference still 2.1112 m; 46/17 @ 90 rpm still
  30.85 km/h
- `circumferenceMm: 2130` → development = ratio × 2.130; gear inches,
  gain, speed use `D_mm = 2130 / π`; skid patches unchanged vs unset

### `src/lib/search.ts`

- `{}` → `stay: 410`, no `circ` key
- stay 300 → 350; 500 → 450
- circ 1000 or `"foo"` → no `circ`; `2130` → 2130
- Tuple length 6 unchanged; length 7 with 2130 sets circ; length 5
  discarded
- `formatCompareTuple` is 6 fields without circ, 7 with

### saved-store

- Optional `circumferenceMm` round-trips
- Invalid circ dropped, bike kept
- Export JSON has no stay
- `{ v: 2, setups: [] }` still refused

### UI

- Default calculator: `98 links`, warning copy visible
- Empty circ field omits `circ` from the URL
- Compare: circ stepper, no stay control
- `/` → `/explore` keeps `stay` and `circ` when present
