# UI / UX Design

## Visual language

- Industrial-meets-velodrome: monospace numerals for all metrics
  (`font-variant-numeric: tabular-nums`), generous whitespace, one accent
  color (safety-orange `#FF5A1F` on near-black `#111214` dark /
  off-white `#FAFAF8` light).
- Metric cards: large number, small label, "?" tooltip trigger.
- Sliders with live numeric readouts; steppers for precise entry.

## Layout

### `/` (calculator)

Five unique cards. Hero vs secondary length follows the units toggle
(metric: development hero, gear inches secondary; imperial: the reverse).
No rollout card.

```text
┌─────────────────────────────────────────┐
│ Header: logo · nav · units · theme · copy│
├──────────────┬──────────────────────────┤
│ INPUTS       │ METRIC CARDS             │
│ chainring    │ ratio · hero · secondary │
│ cog          │ gain · skid              │
│ wheel/tire   ├──────────────────────────┤
│ crank        │ SPEED @ CADENCE TABLE    │
│ ambi toggle  ├──────────────────────────┤
│ presets      │ SKID PATCH VISUALIZER    │
│              │ + Improve this           │
└──────────────┴──────────────────────────┘
```

Mobile: single column — inputs collapse into a native `<details>` disclosure,
metrics and visualizer stack below.

### `/compare`

Horizontal scroll on mobile; sticky first column (metric names). Each
setup column has a **compact header** (steppers + selects, no sliders)
above the metric rows. Delta badges vs column 1.

### `/explore`

Full-width heatmap; legend + metric selector + ≥8 toggle above; cell
tooltip on hover/long-press showing exact config. Diverging scale centered
on the current bike; sequential green for skid patches.

## Component inventory

All built on native HTML elements styled with Tailwind (ADR-001). Each
wrapper in `src/components/ui/` exposes a stable props API so a future
headless-library migration touches only wrapper internals.

| Component | Purpose | Notes |
| --- | --- | --- |
| `ToothInput` | slider + stepper combo | native `input[type=range]` + `input[type=number]`; reuse for tire width |
| `MetricCard` | value + label + tooltip | tabular-nums, `aria-live="polite"` on value |
| `Tooltip` | "?" popover | button + panel, `aria-describedby` |
| `CadenceTable` | speed rows | 9 rows, highlight 90 rpm, one speed column |
| `SkidVisualizer` | SVG donut + patches | pure SVG, `role="img"` + `aria-label`; two colors only for two foot-sets |
| `SkidSuggestions` | ranked improvement list | applies on click; panel stays if empty |
| `CompareTable` | N-column metric table | delta vs col 1; best highlight on skid only |
| `CompareColumnHeader` | compact config editors | steppers + selects; no sliders |
| `HeatmapGrid` | CSS grid of cells | color scale centered on current setup |
| `PresetChips` | ring/cog presets | subtitle = gear inches on current wheel |
| `UnitToggle`, `ThemeToggle` | prefs | in header |
| `CopyLinkButton` | clipboard share | copies `location.href`; success feedback |

## Accessibility

- Native elements give keyboard + semantics for free; add `aria-label` to
  every input.
- Heatmap cells are real `<button>`s with `aria-label` like
  "48 tooth chainring, 16 tooth cog, 77.8 gear inches".
- Skid visualizer has a text alternative: "17 skid patches, evenly spaced."
  Even-ring ambi adds that the opposite foot hits the same patches.
- Color is never the sole signal: heatmap cells also show values on focus;
  warnings use icon + text; “best” skid cells also use icon/text, not only
  background.
- Respect `prefers-reduced-motion` for visualizer transitions.

## Performance

- Everything is fine-grained: dragging the chainring slider updates only the
  text nodes that changed. No memoization hacks needed beyond `createMemo`.
- Heatmap (23 × 13 = 299 cells) renders once; cell colors are memos keyed
  off the selected metric **and** the current setup’s value (scale center).
- Route-level code splitting via `autoCodeSplitting: true`.
