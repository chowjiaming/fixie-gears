# Feature Specifications

Calculator search params (`v`, `chainring`, `cog`, `wheel`, `tire`, `crank`,
`ambi`, `stay`, optional `circ`) are **global**: every route carries them.
See `docs/04`. Search schema version stays `v=1`.

## F1 — Gear Calculator (route: `/`)

Primary screen. Layout: inputs left (top on mobile), results right.

### Inputs

- Chainring teeth: slider + numeric stepper (20–80)
- Cog teeth: slider + numeric stepper (9–30)
- Wheel size: select (`700c`, `650b`, `26"`) — sets bead seat diameter
- Tire width: slider + numeric stepper (18–50 mm), same pattern as teeth
- Measured circumference: optional number input (mm, placeholder
  `optional`). Empty clears `circ` from the URL. Valid range 1800–2500.
- Crank length: select (165 / 167.5 / 170 / 172.5 / 175)
- Chainstay: metric millimetre stepper 350–450 (default 410); imperial
  0.1″ steps writing clamped mm to the URL. Stay is URL-only — not saved.
- Ambidextrous skidder: toggle

All inputs are native HTML elements (`input[type=range]`,
`input[type=number]`, `select`) wrapped by components in
`src/components/ui/`. No third-party component library (see ADR-001).

### Outputs (metric cards, live-updating)

Five cards — no rollout card, no chain card, no fake sixth:

1. Gear ratio (e.g., "2.71")
2. **Hero length** — development if units are metric (e.g., "5.73 m");
   gear inches if imperial (e.g., "71.9″")
3. **Secondary length** — the other of those two
4. Gain ratio (e.g., "5.35")
5. Skid patches, with warning state when ≤ 2

Plus a speed-at-cadence table (9 rows, 90 rpm highlighted, **one** speed
column following units).

Development tooltip includes “aka rollout.” Wheel-diameter / development /
gain tooltips note the BSD+2×width approximation when circ is unset; when
set, they say the taped circumference is in use.

### Chain panel (after skid)

Right column, below the skid visualizer + Improve this:

- Primary: `{evenLinks} links`
- Secondary: `{oddLinks} with a half-link`
- Warning when `halfLinkCloser` (odd count is closer than even)

### Behavior

- Every input writes to URL search params via `navigate({ search })`
  with `replace: true` (no history spam while dragging sliders).
- All outputs are memos off the parsed search params; updates are
  synchronous.
- Each metric card has a "?" tooltip with a one-paragraph explanation and
  the formula. Implement as a small custom popover in `components/ui/`
  (button + absolutely positioned panel, `aria-describedby` wiring).
- Presets are named ring/cog chips. They write `chainring` + `cog` only.
  Chip subtitle shows gear inches for the **current** wheel.

## F2 — Skid Patch Visualizer (section of `/`)

- SVG donut representing the tire; markers at each skid patch angle
  (angles from `skidPatchAngles` in `lib/gear/skid.ts`).
- Animates marker count changes (CSS transitions on marker
  opacity/position). Respect `prefers-reduced-motion`.
- Two colors **only** when ambidextrous **and** the chainring is odd
  (RFF vs LFF interleaved). Otherwise one color. If ambi is on and the
  ring is even, show “opposite foot hits the same patches.”
- Adjacent panel: "Improve this" — top 3 from
  `suggestSkidImprovements(config)`, each clickable (writes ring + cog,
  keeps the rest). If the list is empty, **keep the panel** with copy that
  no nearby tooth change improves skid patches, plus the even-ring note
  when it applies. Do not widen ±2 to fill the list.

## F3 — Setup Comparison (route: `/compare`)

- Column 1 is the **live** global setup. Editing it writes the shared
  search params (the calculator changes too).
- Extra columns `c2`, `c3`, `c4` are optional compact tuples
  `ring,cog,wheel,tire,crank,ambi` or seven fields with trailing `circ`.
  Compact; no holes (`c3` without `c2` becomes `c2`).
- Stay is global (not in tuples). Compare headers expose circ after tire;
  no chainstay control and no chain row.
- **0 extras → seed `c2 = cog+1` and `c3 = cog−1`** (clamped), three
  columns. **`c2` only → two columns.** Clearing the last extra re-seeds
  to three. There is no 1-column compare.
- Add column: copy of column 1 into the next empty slot (max 4). Cannot
  remove column 1.
- Per-column **compact header**: number steppers for ring/cog/tire/circ,
  selects for wheel/crank, ambi toggle. **No sliders.**
- Table of all derived metrics (the five cards + cadence-at-90). Delta
  badges vs column 1. **Best-in-row only for skid patches** (higher =
  better). No gear-inch target.
- “Save all” writes each column into the saved-setups store as
  `"Compare 1 – 46/17"` etc., no second prompt.

## F4 — Ratio Explorer (route: `/explore`)

- Grid: chainrings (columns, 38–60) × cogs (rows, 11–23). Fixed window;
  setups outside it exist on `/` but have no outline here.
- Cell metric in the URL: `metric=gi|dev|skid` (default `gi`).
- Filter in the URL: `minSkid=0|8` (default `0`). `8` dims cells with
  fewer than 8 patches; it does not hide them.
- Color scale: **diverging, centered on the current setup’s value** for
  gear inches and development (they are proportional at a fixed wheel).
  Sequential green for skid patches. Values outside the scale clamp to
  the endpoints.
- Current config’s cell outlined when it falls in the window; clicking a
  cell writes ring+cog on the global search and navigates to `/`.
- Heatmap cells are real `<button>`s with descriptive `aria-label`s.
- Heatmap metrics honor the current wheel’s optional `circ`.

## F5 — Saved Setups (route: `/saved`)

- Record shape: `{ id, name, savedAt, config }`. Never store derived
  metrics. Optional `config.wheel.circumferenceMm` round-trips; stay is
  **not** in the file.
- Save current config with a name (draft-first store → localStorage).
- Load writes the global search (including circ when present) and
  **navigates to `/`**, overlaying the current URL `stay`.
- List with metric summaries; rename, duplicate, delete. **No
  drag-reorder.**
- Export/import as JSON: `{ v: 1, setups: [...] }`. Unknown `v` refuses
  the whole file with an error. v1 rows that fail validation are skipped;
  the rest **merge** (new ids append; same id overwrites). Invalid circ on
  a row is dropped; the bike is kept.

## F6 — Preferences (global, in `__root.tsx`)

- Units: default **metric**. Metric hero is development + km/h; imperial
  hero is gear inches + mph. Both length metrics stay on screen (hero vs
  secondary). Cadence table shows one speed column.
- Theme: light/dark/system via `prefers-color-scheme` + class toggle.
- Persisted to localStorage, hydrated before first paint to avoid flash.

## F7 — Sharing

- Copy-link copies the current URL (clipboard feedback). On `/compare`
  that includes `c2`…; on `/explore` that includes `metric` / `minSkid`.
- Search param schema is versioned (`v=1`) so future schema changes can
  migrate old links. Stay and circ (when set) ride along on every route.
