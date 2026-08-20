# Developer Handbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the greenfield build spec in `docs/` with a four-page
living handbook, a summarizing README, and an `AGENTS.md` that points
instead of bootstrapping from seed files.

**Architecture:** Forward-only file replace. New handbook pages first,
then retarget pointers, then delete the numbered docs and
`docs/superpowers/` (including this plan). No `src/` changes. No git
history rewrite.

**Tech Stack:** Markdown, pnpm 11, Biome, Vitest (docs-only; suite
stays 152).

**Spec:** `docs/superpowers/specs/2026-08-20-developer-handbook-design.md`

**Branch:** `docs/developer-handbook` (spec commit is `5e5a921`).

## Global Constraints

- No new npm dependencies. Do not bump TanStack or `solid-js`.
- pnpm only. Never commit `package-lock.json`.
- No `src/` or test changes. `pnpm test` stays 152.
- Search `v` stays `1`. No domain, URL, or UI code changes.
- Do not rewrite git history. Do not force-push `main`.
- README must not mention the Solid `bare` template, an SSR flip, or
  "offline-first". README must not contain formulas.
- When this plan and `src/` disagree, `src/` wins.
- `.superpowers/` (gitignored SDD scratch) is not `docs/superpowers/`.
  Leave `.superpowers/` alone.
- Do not delete `docs/00`–`08` or `docs/superpowers/` until Task 6.
- If a fence in this plan looks nested or broken, copy README / AGENTS
  from the spec's `~~~~markdown` blocks.

---

## File map

- Create: `docs/architecture.md`, `docs/domain.md`,
  `docs/state-and-routing.md`, `docs/decisions.md`
- Replace: `README.md`, `AGENTS.md`
- Modify: `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/feature.yml`
- Delete (Task 6 only): `docs/00`–`docs/08`, `docs/superpowers/`

---

### Task 1: Architecture handbook page

**Files:**
- Create: `docs/architecture.md`

**Interfaces:**
- Consumes: nothing
- Produces: `docs/architecture.md` with headings Stack, Rendering,
  Directory layout, State, UI conventions, Testing and CI. Later tasks
  link here.

- [ ] **Step 1: Write `docs/architecture.md`**

Create the file with exactly this body (outer fence is tildes):

~~~~markdown
# Architecture

How Fixie Gears is put together. Domain math:
[domain](domain.md). URL and stores:
[state and routing](state-and-routing.md). Decisions:
[ADRs](decisions.md).

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Solid 2.0 (RC) | Fine-grained reactivity; no VDOM |
| Compiler | `@solidjs/vite-plugin` | Oxc-based, `solid({ start: true })` |
| Serving | Vite start mode, client-only | Emits static `dist/client` |
| Routing | `@tanstack/solid-router` | File-based, typed search params |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) | Utility-first |
| UI primitives | Native HTML + Tailwind wrappers | ADR-001 in [decisions](decisions.md) |
| Tests | Vitest + `@solidjs/testing-library` | Next to the source they cover |
| Hosting | Netlify (static) | ADR-003 in [decisions](decisions.md) |

## Rendering

Pure SPA. All domain math is synchronous and local, so there is no SSR.
`solid({ start: true })` without `ssr: true` gives a streamed document
shell in dev and a fully static build for Netlify (`dist/client` plus
the SPA fallback in `netlify.toml`). Do not set a router basepath; the
site serves from `/`.

## Directory layout

```text
src/
├── App.tsx
├── Document.tsx
├── router.tsx
├── routeTree.gen.ts      # generated; do not edit
├── styles.css
├── routes/
│   ├── __root.tsx        # shell: skip link, header, Outlet, #main
│   ├── index.tsx         # calculator
│   ├── compare.tsx
│   ├── explore.tsx
│   └── saved.tsx
├── lib/
│   ├── gear/             # pure math; no framework imports
│   │   ├── types.ts
│   │   ├── wheels.ts
│   │   ├── calculations.ts
│   │   ├── skid.ts
│   │   └── chain.ts
│   ├── search.ts         # shared calculator search + compare tuples
│   ├── format.ts
│   ├── design-contracts.test.ts
│   └── state/
│       ├── setup-store.ts
│       ├── saved-store.ts
│       └── prefs-store.ts
└── components/
    ├── calculator/
    ├── skid/
    ├── compare/
    ├── explore/
    ├── saved/
    └── ui/
```

Tests sit next to the source they cover (`*.test.ts` / `*.test.tsx`).
Do not list every test file in the tree.

## State

Three tiers, in order of authority:

1. **URL search params** — the active drivetrain, on every route.
2. **Solid stores** — prefs and saved setups (draft-first).
3. **localStorage** — `fixie:prefs` and `fixie:saved`.

Derived metrics are never stored — they are `createMemo` computations.
Units and theme are not in the URL. Details:
[state and routing](state-and-routing.md).

## UI conventions

Native wrappers live in `src/components/ui/`: `Button`,
`SegmentedControl`, `ToothInput`, `CircumferenceInput`, `MetricCard`,
`CadenceTable`, `PresetChips`, `Tooltip`, `CopyLinkButton`,
`UnitToggle`, `ThemeToggle`.

Tokens in `src/styles.css`: `--color-accent` (`#FF5A1F`) for fills,
borders, and graphics; `--color-accent-ink` (`#C2410C`) for accent
text and outlines on paper. Accent-as-text is
`text-accent-ink dark:text-accent`. Text on an accent fill is
`text-ink`. See ADR-008.

The calculator (`/`) has one `sr-only` `aria-live="polite"` region;
metric cards are silent. The skip link goes to `#main`. The explore
heatmap must not use `role="grid"`, `role="row"`, or `role="gridcell"`
(ADR-009). `src/lib/design-contracts.test.ts` enforces accent-contrast
and focus-ring contracts.

## Testing and CI

```bash
pnpm test
pnpm typecheck
pnpm check
pnpm build    # emits dist/client
```

CI is `.github/workflows/ci.yml` (the same four commands). Lefthook
runs Biome on commit and Biome plus typecheck on push.
~~~~

Do not copy `docs/01-architecture.md`. Do not paste ASCII wireframes.

- [ ] **Step 2: Confirm headings and tree names**

Run:

```bash
rg -n '^## ' docs/architecture.md
rg -n 'Document.tsx|chain.ts|design-contracts|components/saved|routeTree.gen' docs/architecture.md
```

Expected headings: Stack, Rendering, Directory layout, State, UI
conventions, Testing and CI. Expected: every rg name above matches
once. `docs/01-architecture.md` still exists (deleted in Task 6).

- [ ] **Step 3: Commit**

```bash
git add docs/architecture.md
git commit -m "$(cat <<'EOF'
docs: add architecture handbook page

EOF
)"
```

---

### Task 2: Domain handbook page

**Files:**
- Create: `docs/domain.md`

**Interfaces:**
- Consumes: types and formulas from `src/lib/gear/` (not `docs/02`)
- Produces: `docs/domain.md`. Task 5 README links here.

- [ ] **Step 1: Write `docs/domain.md`**

Transcribe from `src/lib/gear/types.ts`, `wheels.ts`, `calculations.ts`,
`chain.ts`, and `skid.ts`. If `src/` has changed since this plan was
written, follow `src/`. Create the file with exactly this body unless
`src/` disagrees:

~~~~markdown
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
~~~~

- [ ] **Step 2: Confirm types match `src/` and tests still agree**

Run:

```bash
rg -n '^## ' docs/domain.md
rg -i 'stay is not on' docs/domain.md
rg -n 'circumferenceMm' docs/domain.md src/lib/gear/types.ts
test "$(rg -c 'even 98' docs/domain.md)" = 1
pnpm test -- src/lib/gear
```

Expected: `pnpm test -- src/lib/gear` passes (same gear tests as
HEAD). Do not add tests.

- [ ] **Step 3: Commit**

```bash
git add docs/domain.md
git commit -m "$(cat <<'EOF'
docs: add domain handbook page

EOF
)"
```

---

### Task 3: State and routing handbook page

**Files:**
- Create: `docs/state-and-routing.md`

**Interfaces:**
- Consumes: `src/lib/search.ts`, `src/lib/state/*`
- Produces: `docs/state-and-routing.md` (Solid 1.x replacements live
  here; `AGENTS.md` in Task 5 points at this file)

- [ ] **Step 1: Write `docs/state-and-routing.md`**

Quote `CalculatorSearch` from `src/lib/search.ts`. `useCurrentSetup`
takes a search accessor (see `src/lib/state/setup-store.ts`), not
`Route.useSearch()` internally. Create the file with exactly:

~~~~markdown
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
~~~~

- [ ] **Step 2: Confirm `v: 1` and the accessor signature**

Run:

```bash
rg -n 'v: 1' docs/state-and-routing.md src/lib/search.ts
rg -n 'useCurrentSetup\(search' docs/state-and-routing.md src/lib/state/setup-store.ts
rg -n 'createResource|onMount|produce' docs/state-and-routing.md
```

Expected: `v: 1` in both files; `useCurrentSetup(search` in both; the
forbidden names appear only as "No …" rules.

- [ ] **Step 3: Commit**

```bash
git add docs/state-and-routing.md
git commit -m "$(cat <<'EOF'
docs: add state-and-routing handbook page

EOF
)"
```

---

### Task 4: Decisions (ADRs)

**Files:**
- Create: `docs/decisions.md`
- Reads (do not modify): `docs/07-decisions-and-deployment.md`

**Interfaces:**
- Consumes: ADR-001–011 bodies from `docs/07`
- Produces: `docs/decisions.md`. Task 6 deletes `docs/07`.

- [ ] **Step 1: Write `docs/decisions.md`**

Copy ADR-001 through ADR-011 from
`docs/07-decisions-and-deployment.md`. Do not rewrite from memory.
Apply only these edits:

1. Title `# Decisions` (not "Decisions & Deployment").
2. In ADR-001, replace `docs/05-ui-design.md` with
   `docs/architecture.md`.
3. In ADR-011, replace the visitor/engineering bullets with the spec
   text below.

The resulting file is:

~~~~markdown
# Decisions

## UI library decision (ADR-001)

No third-party component library. Kobalte, Ark UI, solid-ui, and solidcn
have not shipped Solid 2.0-compatible releases as of August 2026 (Kobalte
stable peers on solid-js ^1.x; Ark UI deferred to post-RC).

- Use native HTML elements (`input[type=range]`, `select`, `button`,
  `details`, `dialog`) styled with Tailwind 4.
- Wrap each in `src/components/ui/` so a future Kobalte 2.0 migration
  touches only wrapper internals.
- Add ARIA attributes manually: `aria-label` on all inputs, and
  `role="img"` plus `aria-label` on the skid visualizer SVG. Announcing
  a changed value is a page-level job rather than a component one — `/`
  carries a single `sr-only` `aria-live="polite"` region and the metric
  cards are silent (see `docs/architecture.md`).

## Form library decision (ADR-002)

No form library. Calculator inputs write directly to URL search params
via `navigate({ search, replace: true })`; validation is clamping / snapping
inside `validateSearch`. Do not introduce `@tanstack/solid-form` or
`@modular-forms/solid` — they create a second source of truth that
competes with the URL.

## Deployment (ADR-003)

Netlify, static site.

- Build command: `pnpm run build`
- Publish directory: `dist/client`
- SPA fallback via `netlify.toml` redirects (see repo root)
- Production deploys from `main`; PRs get deploy previews
- Do NOT configure a router basepath; the site serves from `/`
- Chosen over GitHub Pages because: clean SPA fallback for deep links
  (no 404 hack or hash history), no repo-name basepath, deploy previews,
  and a functions upgrade path if accounts/sync land later.

This build is local computation, not a PWA. Do not describe the site as
offline-first in the UI or README until an installable manifest exists.

## TanStack version pins (ADR-004)

`@tanstack/solid-router` and `@tanstack/solid-router-devtools` are pinned
to the **`2.0.0-rc.x`** line (Solid 2.0-compatible). The `latest`
dist-tag (1.x) peers on solid-js ^1.x and MUST NOT be installed.

- `@tanstack/router-plugin` stays on latest 1.x.
- `solid-js` / `@solidjs/web` are pinned to `2.0.0-rc.1` and re-enforced
  via package.json `overrides` (pnpm honors this field). Do not remove
  them, and do not loosen the pins back to a caret while they are RCs.
- Never run `pnpm update` on TanStack packages without checking peer
  ranges against the installed solid-js version first.

## Skid formula (ADR-005)

Ambidextrous doubling uses the physical rule: **only an odd chainring**
puts the opposite foot on a new set of patches.

```text
base = cog / gcd(ring, cog)
patches = ambi && ring is odd ? base × 2 : base
```

Always-×2 (the first seed draft) disagrees with experienced riders on even
rings (48/16 ambi is still 1 patch, not 2; 46/17 ambi is still 17, not 34).
No toggle for the “classic always-double” formula.

Visualizer two-color rendering follows the same rule: two colors only when
there are two foot-sets.

## Wheel catalog (ADR-006)

Sizes: **700c (622), 650b (584), 26in (559)**. Tire width **18–50 mm**.

650c (571) is a rare triathlon / old-track size; street/gravel/commuter
bikes that aren’t 700c are 650b. 650c remains deferred. Unknown `wheel`
values, including `650c`, parse as `700c`.

Diameter defaults to `BSD + 2 × tireWidth` so chart numbers remain
comparable to other web calculators. The tooltip discloses the
approximation. **Measured circumference is implemented** as optional URL
`circ` / `WheelSpec.circumferenceMm` (integer 1800–2500 mm). When set,
`C_m = circ / 1000` and `D_mm = circ / π`. When unset or invalid, the BSD
approximation remains the default.

## Global search and compare encoding (ADR-007)

The calculator keys live on **every** route, including required `stay`
(default 410) and optional `circ`. Compare extras are optional compact
tuples `c2`/`c3`/`c4` — six fields without circ, seven with. Missing
**all** extras seeds neighbor cogs (the shop question: 17 vs 16 vs 18). A
link with only `c2` is a two-bike compare and must not bounce back to
three. One-column compare is not a product.

Column 1 is a live alias of the global search, not a snapshot. Stay is
URL-only (not in tuples or saved setups).

## Accent-ink token (ADR-008)

Two oranges exist because one cannot do both jobs. The brand accent
`#FF5A1F` measures **2.98:1** on paper `#FAFAF8`, well under WCAG AA's
4.5:1 floor for body text, so every accent-colored warning and badge in
light mode failed. `#C2410C` measures **4.95:1** on the same paper, and
the brand orange already measures **6.01:1** on ink `#111214`.

- `--color-accent` (`#FF5A1F`) stays the fill, border, and graphic
  color, unchanged.
- `--color-accent-ink` (`#C2410C`) is accent as *text or outline* on
  paper. Accent-as-text is always written
  `text-accent-ink dark:text-accent`, so dark mode keeps the brand
  orange.
- Text on an accent fill is `text-ink`. That pairing is mode-independent
  because the fill color does not change between themes.
- Rejected: darkening the brand accent everywhere. It changes the fill
  identity of the whole app to fix a text problem, and the fill already
  passes.
- Rejected: keeping `text-paper` on accent fills. That pairing is the
  same 2.98:1 — it is the bug, not an alternative to it.
- Heatmap cell fills are data visualization rather than text and stay
  outside the rule. `src/lib/design-contracts.test.ts` enforces the rest
  repo-wide.

## No ARIA grid roles on the heatmap (ADR-009)

`/explore` renders 23 chainrings × 13 cogs as 299 buttons. Roving
tabindex turns 299 tab stops into one, which is the whole keyboard win.
`role="grid"` / `role="row"` / `role="gridcell"` were considered
alongside it and deliberately left out.

- Each cog row is wrapped in a `display: contents` div, which flattens
  out of the layout exactly the DOM structure those roles describe.
  Adding them would publish an ARIA tree that misdescribes the markup —
  worse than no roles, because assistive technology would trust it.
- Restructuring the grid so the roles would be honest is a larger change
  than a presentation pass warrants. It is deferred, not rejected.
- Restructuring would unlock `aria-rowindex` / `aria-colindex` on every
  move, `role="columnheader"` and `role="rowheader"` for the ring and
  cog labels that are currently `aria-hidden`, and the grid pattern's
  own conventions such as Ctrl+Home to the first cell.
- Until then every cell keeps its full `aria-label` ("46 tooth
  chainring, 17 tooth cog, 71.6 gear inches"), so only the positional
  shorthand is missing.

## Package manager (ADR-010)

**pnpm only.** The Solid `bare` template shipped a `pnpm-lock.yaml` and
the scaffold then ran `npm install`, which added a `package-lock.json`.
Every later dependency change updated only the npm lock, so the pnpm
lock went stale (it never listed Biome, Lefthook, or TanStack).

- `package.json` pins the version via `packageManager` (`pnpm@11.17.0`).
  Install pnpm with the [standalone script](https://pnpm.io/installation)
  (or Homebrew / winget / Scoop). Do **not** use Corepack: Node.js
  stopped shipping it in v25, and pnpm dropped it from the CI docs
  because the Corepack shim starts Node.js on every `pnpm` invocation.
  The standalone binary reads `packageManager` itself and switches to
  that version on first use.
- `pnpm-workspace.yaml` is settings, not a monorepo: it allows Lefthook's
  postinstall (the native binary the git hooks invoke) and sets
  `minimumReleaseAge: 0` so RC/`next` tags are not delayed 24h behind
  npm's "latest in range" resolution.
- Netlify detects pnpm from `pnpm-lock.yaml` (and will prefer npm if a
  `package-lock.json` is also present — do not re-add one).
- `overrides` stays on `package.json` (ADR-004); pnpm honors that field.

## Public repository (ADR-011)

The app is a public resource, not an npm package.

- MIT at repo root (`LICENSE`), copyright 2026 chowjiaming, so GitHub
  detects the license. `package.json` stays `"license": "MIT"` and
  `"private": true` to block accidental publish.
- Visitor-facing product copy lives in `README.md`. `README.md` also
  carries a short paragraph per handbook page with a link to the full
  version. Engineering docs live in `docs/`. Formulas and search-param
  tables live only in `docs/domain.md` and
  `docs/state-and-routing.md`.
- CI is GitHub Actions (`.github/workflows/ci.yml`). Deploy remains
  Netlify (`netlify.toml`). Package manager is pnpm, not Corepack
  (ADR-010).
~~~~

- [ ] **Step 2: Confirm ADR-011 and the architecture link**

Run:

```bash
rg -n 'ADR-011|docs/architecture.md|docs/domain.md|Do not duplicate domain math' docs/decisions.md
```

Expected: ADR-011 heading present; `docs/architecture.md` present;
`docs/domain.md` present; `Do not duplicate domain math` **absent**.

- [ ] **Step 3: Commit**

```bash
git add docs/decisions.md
git commit -m "$(cat <<'EOF'
docs: move ADRs into docs/decisions.md

EOF
)"
```

---

### Task 5: README, agents, and pointers

**Files:**
- Replace: `README.md`, `AGENTS.md`
- Modify: `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/feature.yml`

**Interfaces:**
- Consumes: the four handbook pages from Tasks 1–4
- Produces: visitor README summaries; agent pointers; no `docs/00`

If the fences below look nested, copy README (from `## Stack` onward)
and the entire `AGENTS.md` from the spec
`docs/superpowers/specs/2026-08-20-developer-handbook-design.md`.

- [ ] **Step 1: Overwrite `README.md`**

Keep the product block (title through the Lefthook sentence). The
full file is:

~~~~markdown
# Fixie Gears

A street-fixie ratio calculator. Pick a chainring, cog, wheel, and
crank; get gear inches, development, gain ratio, speed at cadence, skid
patches, and chain-link counts. The URL is the source of truth, so
every setup is shareable.

**[Open the calculator](https://fixie-gears.netlify.app/)**

## What it does

- Calculator with live metric cards, cadence table, and skid visualizer
- Optional taped tire circumference and chainstay → even/odd chain links
- Compare up to four setups; explore nearby ratios on a heatmap
- Saved bikes stay in this browser (`localStorage`); no account
- Metric / imperial and light / dark

All math runs in the browser. There is no backend.

## Develop

Requires [pnpm](https://pnpm.io/installation) 11 (standalone script,
Homebrew, winget, or Scoop — not Corepack) and Node.js 22.13+.

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test
pnpm check        # Biome
pnpm typecheck
pnpm build        # emits dist/client
```

Lefthook runs Biome on commit and Biome plus typecheck on push.

## Stack

Solid 2.0, TanStack Solid Router, Vite, Tailwind 4. Deployed as a static
SPA on Netlify (`netlify.toml`).

## Architecture

Client-only SPA. File routes under `src/routes/` share one calculator
search schema. Domain math is pure TypeScript in `src/lib/gear/` with
no framework imports. UI is native HTML plus Tailwind wrappers in
`src/components/ui/`. Tests sit next to the code they cover.

[Full version: architecture](docs/architecture.md)

## Domain math

Changing teeth, wheel, or crank recomputes ratio, gear inches,
development, gain ratio, speed at cadence, and skid patches in the
browser. Optional taped circumference replaces the BSD+2×width
diameter estimate. Chainstay lives only in the URL and feeds even/odd
chain-link counts — it is not on the drivetrain type.

[Full version: domain](docs/domain.md)

## State and routing

The bike is the URL search string on every route (`v`, `chainring`,
`cog`, `wheel`, `tire`, `crank`, `ambi`, `stay`, optional `circ`).
Inputs write through `navigate({ search, replace: true })`. Derived
metrics are memos, never stored. Units and theme are local prefs, not
the link.

[Full version: state and routing](docs/state-and-routing.md)

## Decisions

No third-party component or form library. Deploy is Netlify static
(`dist/client`). `solid-js` and TanStack Solid Router stay on the 2.0
RC line. Package manager is pnpm, not Corepack. The repo is MIT and
`private` so it cannot be published to npm by accident.

[Full version: decisions](docs/decisions.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Agents: [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)
~~~~

- [ ] **Step 2: Overwrite `AGENTS.md`**

Replace the file with exactly:

~~~~markdown
# Agent Instructions

Fixie Gears is a Solid 2.0 street-fixie ratio calculator. Behavior
lives in `src/`. Constraints live here and in the handbook pages
named below.

## Open when the task needs it

- Stack, `src/` layout, UI wrappers, how to test:
  [`docs/architecture.md`](docs/architecture.md)
- Types, formulas, skid patches, chain links:
  [`docs/domain.md`](docs/domain.md)
- URL search, compare/explore extras, Solid 1.x replacements:
  [`docs/state-and-routing.md`](docs/state-and-routing.md)
- Why a rule exists (ADRs):
  [`docs/decisions.md`](docs/decisions.md)

## Hard rules

- **Solid 2.0 APIs only.** Forbidden: `createResource`, `batch`,
  `startTransition`, `useTransition`, `on`, `createComputed`, `produce`,
  `createMutable`, `onMount`, `classList`, `use:` directives, `<Index>`.
  Replacements: `docs/state-and-routing.md`.
- `<For>` children receive accessors:
  `{(item) => <li>{item().name}</li>}`.
- **No third-party component or form libraries** (ADR-001, ADR-002 in
  `docs/decisions.md`). Native elements + Tailwind wrappers in
  `src/components/ui/`.
- All domain math lives in `src/lib/gear/` as pure functions with no
  framework imports. UI never contains formulas.
- Never store derived values in signals/stores — always `createMemo`.
- Config changes go through `navigate({ search, replace: true })`; never
  mutate search state locally.
- Calculator search params are global; navigating between routes must
  spread them. Do not claim offline-first in UI copy.
- Format and lint with Biome (`pnpm format` / `pnpm check`). Print
  width 80, 2-space indent. Lefthook runs Biome on commit and Biome plus
  typecheck on push.
- After editing, `pnpm test`, `pnpm typecheck`, and `pnpm check` must
  pass. `pnpm build` must emit `dist/client`.
- Package manager is **pnpm**. Do not run `npm install` or commit a
  `package-lock.json`.
- PRs must stay green on GitHub Actions CI (`pnpm check`, `pnpm
  typecheck`, `pnpm test`, `pnpm build`).

## Dependency pinning (ADR-004)

- `@tanstack/solid-router` and `@tanstack/solid-router-devtools` are
  pinned to the `2.0.0-rc.x` line (Solid 2.0-compatible). The `latest`
  dist-tag (1.x) peers on solid-js ^1.x and MUST NOT be installed.
- `@tanstack/router-plugin` stays on latest 1.x.
- `solid-js` / `@solidjs/web` are pinned to `2.0.0-rc.1` and re-enforced
  via package.json `overrides`. Do not remove them.
- Never run `pnpm update` on TanStack packages without checking peer
  ranges against the installed solid-js version first.
~~~~

- [ ] **Step 3: Point `CONTRIBUTING.md` at the README map**

In `CONTRIBUTING.md`, replace only the last project-rule bullet
(`Agents: read AGENTS.md and docs/00…`) with:

```markdown
- Agents: [`AGENTS.md`](AGENTS.md). Handbook map: [README.md](README.md).
```

Keep the three bullets above it (UI wrappers, domain math, pin policy).

- [ ] **Step 4: Retarget the feature issue template**

In `.github/ISSUE_TEMPLATE/feature.yml`, replace the markdown `value`
with:

```yaml
      value: >
        Geared/derailleur drivetrains and a backend are non-goals.
        See the README for what the app does.
```

- [ ] **Step 5: Verify pointers and the suite**

Run:

```bash
rg -n 'docs/00-project-overview|docs/08-seed|read all' README.md AGENTS.md CONTRIBUTING.md .github/ISSUE_TEMPLATE/feature.yml
rg -n 'Full version: architecture|Full version: domain' README.md
pnpm test
pnpm typecheck
pnpm check
```

Expected: first rg empty. README has the four "Full version" links.
Tests 152 passed. Typecheck and check clean. Do not fail if Biome
skips markdown.

- [ ] **Step 6: Commit**

```bash
git add README.md AGENTS.md CONTRIBUTING.md .github/ISSUE_TEMPLATE/feature.yml
git commit -m "$(cat <<'EOF'
docs: point README and agents at the handbook

EOF
)"
```

---

### Task 6: Delete planning docs

**Files:**
- Delete: `docs/00-project-overview.md`, `docs/01-architecture.md`,
  `docs/02-domain-model.md`, `docs/03-features.md`,
  `docs/04-state-and-routing.md`, `docs/05-ui-design.md`,
  `docs/06-testing.md`, `docs/07-decisions-and-deployment.md`,
  `docs/08-seed-code.md`, `docs/superpowers/` (every remaining spec
  and plan, including this plan)

**Interfaces:**
- Consumes: Tasks 1–5 already published the living docs
- Produces: `docs/` contains exactly four markdown files

This commit removes the spec and this plan from `HEAD`. That is
intended; they remain in git history. Do not rewrite history.

- [ ] **Step 1: Remove the old numbered docs and `docs/superpowers/`**

```bash
git rm docs/00-project-overview.md \
  docs/01-architecture.md \
  docs/02-domain-model.md \
  docs/03-features.md \
  docs/04-state-and-routing.md \
  docs/05-ui-design.md \
  docs/06-testing.md \
  docs/07-decisions-and-deployment.md \
  docs/08-seed-code.md
git rm -r docs/superpowers
```

Do not delete `.superpowers/` (gitignored). Do not `git filter-repo`.

- [ ] **Step 2: Sweep tracked files**

Run:

```bash
ls docs
git grep -E 'docs/0[0-8]|docs/superpowers|seed-code' || true
pnpm test
pnpm typecheck
pnpm check
```

Expected `ls docs`:

```text
architecture.md
decisions.md
domain.md
state-and-routing.md
```

No subdirectories. `git grep` prints nothing (exit 1 is success here;
`|| true` keeps the script going — confirm the output is empty
yourself). Tests 152. Typecheck and check clean.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
docs: remove planning specs and numbered docs

EOF
)"
```

---

## Definition of done

- [ ] `docs/` contains exactly `architecture.md`, `domain.md`,
      `state-and-routing.md`, `decisions.md`
- [ ] README product copy intact; four summary sections with
      full-version links; no formulas
- [ ] `AGENTS.md` has no seed / F1–F7 / "read all of docs/"
- [ ] `git grep` for `docs/00`, `docs/08`, `docs/superpowers` is empty
      on tracked files
- [ ] ADR-001 through ADR-011 present in `docs/decisions.md`; ADR-011
      matches the README split
- [ ] `pnpm test` 152, `pnpm typecheck` and `pnpm check` clean
