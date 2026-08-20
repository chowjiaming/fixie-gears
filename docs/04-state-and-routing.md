# State & Routing Design

## Shared calculator search (every route)

The bike is not `/`-only. `__root` does not own search (TanStack file
routes each declare it), so **every route’s `validateSearch` parses the
same calculator keys**, then route-specific extras. Put the shared parser
in `src/lib/search.ts` and call it from each route to avoid four copies.

```ts
// lib/search.ts
import { clampInt, snapCrankMm } from "~/lib/gear/calculations";
import {
  CIRC_MAX_MM,
  CIRC_MIN_MM,
  STAY_DEFAULT_MM,
  STAY_MAX_MM,
  STAY_MIN_MM,
} from "~/lib/gear/chain";
import { parseWheelSize } from "~/lib/gear/wheels";

export interface CalculatorSearch {
  v: 1;
  chainring: number; // 20–80, default 46
  cog: number; // 9–30, default 17
  wheel: "700c" | "650b" | "26in";
  tire: number; // 18–50 mm, default 25
  crank: number; // 165 | 167.5 | 170 | 172.5 | 175, default 170
  ambi: 0 | 1;
  stay: number; // 350–450 mm, default 410
  circ?: number; // 1800–2500 integer mm; omit when unset
}

export function parseCirc(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) return undefined;
  if (n < CIRC_MIN_MM || n > CIRC_MAX_MM) return undefined;
  return n;
}

export function parseCalculatorSearch(
  s: Record<string, unknown>,
): CalculatorSearch {
  const circ = parseCirc(s.circ);
  const result: CalculatorSearch = {
    v: 1,
    chainring: clampInt(s.chainring, 20, 80, 46),
    cog: clampInt(s.cog, 9, 30, 17),
    wheel: parseWheelSize(s.wheel),
    tire: clampInt(s.tire, 18, 50, 25),
    crank: snapCrankMm(s.crank),
    ambi: s.ambi === 1 || s.ambi === "1" ? 1 : 0,
    stay: clampInt(s.stay, STAY_MIN_MM, STAY_MAX_MM, STAY_DEFAULT_MM),
  };
  if (circ !== undefined) result.circ = circ;
  return result;
}
```

Defaults are applied during validation so bare `/` always yields a complete,
valid config. Missing stay → 410 without requiring `?stay=410` in the URL;
write `stay` when the rider edits it. Missing / garbage / out-of-range
`circ` → property **absent** (not `0`). Clearing circ must **delete** the
key (`applySearchPatch` removes it when `circ` is `undefined`).

Read params in components with the route’s `useSearch()`; write with
`useNavigate({ from: Route.fullPath })` and `replace: true`. When
navigating **between** routes, spread the current calculator keys
(including `stay` and `circ` when present) so the bike does not reset.

`crank` is a float in the URL (`?crank=167.5`). Do **not** run it through
`clampInt` — that would round 167.5 to 168.

`toConfig` / `fromConfig` map `circ` ↔ `wheel.circumferenceMm`. Stay is
not on `DrivetrainConfig`; `fromConfig` always emits `stay: 410`
(default). Saved-page load overlays the current URL stay.

## `/compare` extras

On top of `CalculatorSearch`:

```ts
c2?: string; // "48,16,700c,25,170,0" or "...0,2130" with circ
c3?: string;
c4?: string;
```

Parse each present tuple into a `DrivetrainConfig` (same clamps/snaps).
**6 parts** = no circ; **7 parts** = trailing integer circ; any other
length discards that extra. Compact holes (`c3` without `c2` → `c2`). If
**no** extras remain after that, seed `c2` as current cog+1 and `c3` as
current cog−1 (clamped to 9–30, other fields — including circ — copied
from column 1 via `formatCompareTuple`). A URL with only `c2` is a
two-column compare and must **not** re-seed `c3`.

Column 1 is `parseCalculatorSearch`; it is not snapshotted. Stay is
global across columns, not encoded in tuples.

## `/explore` extras

```ts
metric: "gi" | "dev" | "skid"; // default "gi"
minSkid: 0 | 8; // default 0
```

Unknown metric → `"gi"`. `minSkid` is `8` only when the value is `8` or
`"8"`; otherwise `0`.

## Stores

### prefs-store.ts

```ts
import { createStore } from "solid-js";

// Solid 2.0: setters hand you a draft to mutate directly.
const [prefs, setPrefs] = createStore({
  units: "metric" as "metric" | "imperial",
  theme: "system" as "light" | "dark" | "system",
});

setPrefs((d) => {
  d.units = "imperial"; // mutate the draft — no produce(), no path strings
});
```

Default units are **metric**. Persist to `localStorage` key `fixie:prefs`.

### saved-store.ts

Same draft-first pattern; every mutation also writes through to
`localStorage.setItem("fixie:saved", JSON.stringify(...))`. Hydrate lazily
on first read inside a `createRoot` so the pattern stays clean.

```ts
interface SavedSetup {
  id: string;
  name: string;
  savedAt: string; // ISO-8601
  config: DrivetrainConfig; // optional wheel.circumferenceMm; no stay
}
```

Export file: `{ v: 1, setups: SavedSetup[] }`. Import merges. Unknown `v`
rejects the file. Invalid circ fields are dropped; the bike is kept.

## Solid 2.0 idioms the agent MUST follow

These differ from Solid 1.x — do not use removed APIs:

- **No `createResource`.** Async flows through ordinary memos. (This build
  has no async data at all; keep it that way.)
- **No `batch`.** Everything batches automatically on a microtask. Use
  `flush()` only if a synchronous read-after-write is truly needed.
- **No `on` / `createComputed`.** Effects are split:
  `createEffect(compute, apply)` separates tracking from side effects.
- **No `produce` / `createMutable`.** Store setters are draft-first.
- **No `onMount`.** Use `onSettled` (may return a cleanup).
- **Lists:** unified `<For>`; children receive **accessors** —
  `{(item, i) => ...}` with `item()` / `i()`, not raw values.
- **No `classList` prop.** Use `class` with objects/arrays:
  `class={{ "text-red-500": isWarning() }}`.
- **No `use:` directives.** Use `ref` directive factories.
- **Derived state:** prefer `createMemo` (or function forms
  `createSignal(fn)` / `createStore(fn)`) over effects that write state.
  Writing to signals inside reactive scopes triggers dev warnings in 2.0.

## Derived metrics wiring

```ts
// lib/state/setup-store.ts
import { createMemo } from "solid-js";
import { deriveMetrics } from "~/lib/gear/calculations";

export function useCurrentSetup() {
  const search = Route.useSearch();
  const config = createMemo(() => toConfig(search()));
  const metrics = createMemo(() => deriveMetrics(config()));
  return { config, metrics };
}
```

`Route` here is whichever file route the component sits on; all of them
expose the calculator keys. `toConfig` maps `wheel` id + `tire` (+ optional
`circ`) into a `WheelSpec` via `WHEEL_SIZES`.
