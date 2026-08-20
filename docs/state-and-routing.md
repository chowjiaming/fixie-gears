# State and routing

The bike is the URL. Prefs and saved setups are stores plus
localStorage. Derived metrics are memos.

## Shared calculator search

Every file route's `validateSearch` calls `parseCalculatorSearch` in
`src/lib/search.ts` (`index`, `compare`, `explore`, `saved`). `__root`
does not own search.

```ts
export interface CalculatorSearch {
  v: 1;
  chainring: number;
  cog: number;
  wheel: WheelSizeId;
  tire: number;
  crank: number;
  ambi: 0 | 1;
  stay: number;
  circ?: number;
}
```

`v` stays `1`. Defaults apply during validation so `/` is a complete
bike. Missing stay → 410 without requiring `?stay=410`. Missing /
garbage / out-of-range `circ` → property **absent** (not `0`).
`applySearchPatch` deletes `circ` when the patch sets it to
`undefined`.

`crank` is a float (`?crank=167.5`). Do not run it through `clampInt`.

`toConfig` / `fromConfig` map `circ` ↔ `wheel.circumferenceMm`. Stay is
not on `DrivetrainConfig`; `fromConfig` always emits `stay: 410`.
Saved-page load overlays the current URL stay.

## Read and write

Read with the route's `useSearch()`. Write with
`navigate({ search, replace: true })`. Never mutate search locally.
When navigating **between** routes, spread the current calculator keys
(including `stay` and `circ` when present) so the bike does not reset.

```ts
export function useCurrentSetup(search: () => CalculatorSearch) {
  const config = createMemo(() => toConfig(search()));
  const metrics = createMemo(() => deriveMetrics(config()));
  return { config, metrics };
}
```

## Compare extras

On top of `CalculatorSearch`: optional `c2` / `c3` / `c4` compact
tuples. **6 parts** = no circ; **7 parts** = trailing integer circ;
any other length discards that extra. Compact holes (`c3` without
`c2` → `c2`). If **no** extras remain after that, seed `c2` as current
cog+1 and `c3` as current cog−1 (clamped 9–30, other fields — including
circ — copied from column 1). A URL with only `c2` is two-column and
must **not** re-seed `c3`.

Column 1 is a live alias of global search, not a snapshot. Stay is
global across columns, not encoded in tuples.

## Explore extras

```ts
metric: "gi" | "dev" | "skid"; // default "gi"
minSkid: 0 | 8;               // default 0
```

Unknown metric → `"gi"`. `minSkid` is `8` only when the value is `8`
or `"8"`; otherwise `0`.

## Stores

Prefs: `localStorage` key `fixie:prefs`. Default units **metric**,
theme **system**. Draft-first `createStore`; no `produce`.

Saved: key `fixie:saved`. Each row is `{ id, name, savedAt, config }`
where `config` is a `DrivetrainConfig` (optional `circumferenceMm`, no
stay). Export `{ v: 1, setups }`. Unknown `v` rejects the file.
Invalid circ fields are dropped; the bike is kept.

Units and theme are **not** in the URL. A shared link shows the bike;
the recipient sees it in their own prefs.

## Solid 2.0 replacements

Do not use removed 1.x APIs:

- **No `createResource`.** This build has no async data.
- **No `batch`.** Everything batches on a microtask. Use `flush()` only
  for a synchronous read-after-write.
- **No `startTransition` / `useTransition`.**
- **No `on` / `createComputed`.** Use `createEffect(compute, apply)`.
- **No `produce` / `createMutable`.** Store setters are draft-first.
- **No `onMount`.** Use `onSettled` (may return a cleanup).
- **Lists:** `<For>` children receive **accessors** —
  `{(item, i) => ...}` with `item()` / `i()`.
- **No `classList` prop.** Use `class` with objects/arrays:
  `class={{ "text-red-500": isWarning() }}`.
- **No `use:` directives.** Use `ref` directive factories.
- **No `<Index>`.**
- **Derived state:** `createMemo` (or `createSignal(fn)` /
  `createStore(fn)`). Do not write signals inside reactive scopes.
