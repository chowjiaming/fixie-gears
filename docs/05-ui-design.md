# UI / UX Design

## Visual language

- Industrial-meets-velodrome: monospace numerals for all metrics
  (`font-variant-numeric: tabular-nums`), generous whitespace, a
  safety-orange accent on near-black `#111214` dark / off-white
  `#FAFAF8` light.
- Two accent tokens, split by the role the color plays. `--color-accent`
  (`#FF5A1F`) is for fills, borders, and graphics; text sitting on an
  accent fill is always `text-ink`. `--color-accent-ink` (`#C2410C`) is
  for accent-colored *text and outlines* on paper — and dark mode keeps
  the brand orange, so accent-as-text is always written
  `text-accent-ink dark:text-accent`.
- Measured contrast is what forces the split: `#FF5A1F` on `#FAFAF8` is
  2.98:1, under AA's 4.5:1 floor for body text, while `#C2410C` on
  `#FAFAF8` is 4.95:1 and `#FF5A1F` on `#111214` is 6.01:1. ADR-008
  records the alternatives that were rejected.
- Metric cards: large number, small label, "?" tooltip trigger.
- Sliders with live numeric readouts; steppers for precise entry.

## Layout

### `/` (calculator)

Five unique cards. Hero vs secondary length follows the units toggle
(metric: development hero, gear inches secondary; imperial: the reverse).
No rollout card. No chain metric card — chain is a separate panel.

```text
┌─────────────────────────────────────────┐
│ (sr-only) Skip to main content          │
├─────────────────────────────────────────┤
│ Header: logo · nav · units · theme · copy│
├─────────────────────────────────────────┤
│ (sr-only) h1 "Calculator"               │
├──────────────┬──────────────────────────┤
│ INPUTS       │ METRIC CARDS             │
│ chainring    │ ratio · hero · secondary │
│ cog          │ gain · skid              │
│ wheel/tire   │ (sr-only) aria-live      │
│ circ (opt.)  ├──────────────────────────┤
│ crank        │ SPEED @ CADENCE TABLE    │
│ stay         ├──────────────────────────┤
│ ambi toggle  │ SKID PATCH VISUALIZER    │
│ presets      │ + Improve this           │
│              ├──────────────────────────┤
│              │ CHAIN PANEL              │
│              │ even links · half-link   │
└──────────────┴──────────────────────────┘
```

Mobile: single column — inputs collapse into a native `<details>` disclosure,
metrics, visualizer, and chain panel stack below.

### `/compare`

Horizontal scroll on mobile; sticky first column (metric names). Each
setup column has a **compact header** (steppers + selects, no sliders;
circ after tire; no stay) above the metric rows. Delta badges vs column 1.
No chain row.

### `/explore`

Full-width heatmap; legend + metric selector + ≥8 toggle above; cell
tooltip on hover/long-press showing exact config. Diverging scale centered
on the current bike; sequential green for skid patches.

## Component inventory

All built on native HTML elements styled with Tailwind (ADR-001). Each
wrapper in `src/components/ui/` exposes a stable props API so a future
headless-library migration touches only wrapper internals.

| Component                   | Purpose                 | Notes                                                                            |
| --------------------------- | ----------------------- | -------------------------------------------------------------------------------- |
| `Button`                    | inline action button    | native `<button>`; `default` and `danger` variants; no size or disabled props    |
| `SegmentedControl`          | single-select group     | `sr-only` radios + `peer-*` styled spans; arrow keys come from the browser       |
| `ToothInput`                | slider + stepper combo  | native `input[type=range]` + `input[type=number]`; reuse for tire width and stay |
| `CircumferenceInput`        | taped circumference     | optional `input[type=number]`; committing an empty field clears `circ`           |
| `MetricCard`                | value + label + tooltip | tabular-nums; silent — six live regions announced at once, so the page owns one  |
| `Tooltip`                   | "?" popover             | button + panel, `aria-describedby`                                               |
| `CadenceTable`              | speed rows              | 9 rows, highlight 90 rpm, one speed column                                       |
| `SkidVisualizer`            | SVG donut + patches     | pure SVG, `role="img"` + `aria-label`; two colors only for two foot-sets         |
| `SkidSuggestions`           | ranked improvement list | applies on click; panel stays if empty                                           |
| `ChainPanel`                | even/odd link counts    | below skid; warning when `halfLinkCloser`                                        |
| `CompareTable`              | N-column metric table   | delta vs col 1; best highlight on skid only                                      |
| `CompareColumnHeader`       | compact config editors  | steppers + selects; circ; no stay; no sliders                                    |
| `HeatmapGrid`               | CSS grid of cells       | color scale centered on current setup                                            |
| `PresetChips`               | ring/cog presets        | subtitle = gear inches on current wheel                                          |
| `UnitToggle`, `ThemeToggle` | prefs                   | in header; `SegmentedControl` callers (units has 2 options, theme has 3)         |
| `CopyLinkButton`            | clipboard share         | copies `location.href`; success feedback                                         |

## Accessibility

- Native elements give keyboard + semantics for free; add `aria-label` to
  every input (`Measured circumference`, `Chainstay`, etc.).
- Heatmap cells are real `<button>`s with `aria-label` like
  "48 tooth chainring, 16 tooth cog, 77.8 gear inches".
- Skid visualizer has a text alternative: "17 skid patches, evenly spaced."
  Even-ring ambi adds that the opposite foot hits the same patches.
- Color is never the sole signal: heatmap cells also show values on focus;
  warnings use icon + text; “best” skid cells also use icon/text, not only
  background.
- Respect `prefers-reduced-motion` for visualizer transitions.
- Every interactive element carries a visible focus outline in both
  themes, from the `focus-ring` utility in `src/styles.css`. It is drawn
  with `outline`, not `ring` or `box-shadow`, so it survives
  `overflow-hidden` parents. `SegmentedControl` is the one exception: its
  radio is `sr-only`, so the outline has to render on the sibling span
  through `peer-focus-visible:` variants.
- `/` owns exactly one live region. The metric cards and the chain panel
  are silent, and a single `sr-only` `aria-live="polite"` paragraph below
  the cards announces one sentence — "Gear ratio 2.71, development 5.71
  meters, 17 skid patches". Five metric cards plus the chain panel each
  carried a region of their own, so one slider drag fired six
  announcements over the top of each other. The spoken unit spellings
  come from `formatDevelopmentSpoken` / `formatGearInchesSpoken` beside
  the visible formatters, so the read-aloud and printed numbers cannot
  drift apart.
- The `/explore` heatmap is a single tab stop. One cell holds
  `tabindex="0"` — the current bike's, or the top-left cell when the
  current bike is outside the window — and the arrow keys move it:
  left/right steps the chainring, up/down steps the cog, and movement
  clamps at the edges rather than wrapping. `Home` and `End` jump to the
  ends of the cog row; `Enter` commits the focused cell, which is native
  button behavior. An `sr-only` paragraph referenced by
  `aria-describedby` states that model for screen readers.
- Destructive actions confirm in place. `Delete` on a saved setup is
  replaced in its own row by `Confirm delete` and `Cancel`, `Escape`
  cancels, and arming one row disarms any other. No timers and no undo
  path in the store.
- `src/lib/design-contracts.test.ts` is where the contrast and focus
  rules live. It scans every `src/**/*.tsx` for `bg-accent` paired with
  `text-paper`, for a `text-accent` token outside a `dark:` variant
  chain, and for any file that renders a control but mentions no focus
  indicator. New components inherit the rules, and a violation fails CI
  instead of waiting for a reviewer to spot it.

## Performance

- Everything is fine-grained: dragging the chainring slider updates only the
  text nodes that changed. No memoization hacks needed beyond `createMemo`.
- Heatmap (23 × 13 = 299 cells) renders once; cell colors are memos keyed
  off the selected metric **and** the current setup’s value (scale center).
- Route-level code splitting via `autoCodeSplitting: true`.
