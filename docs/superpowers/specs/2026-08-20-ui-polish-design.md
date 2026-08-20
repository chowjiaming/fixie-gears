# UI/UX Polish Pass — Design

A presentation-layer pass over the shipped v1 + v2 app. No domain math
changes, no URL shape changes, no new routes, no new dependencies.

**Job:** the app is functionally complete but has a WCAG-failing color
pair, 299 tab stops on `/explore`, six competing live regions, and a
button style copy-pasted twelve times. Fix the correctness problems and
give the repeated patterns a home in `src/components/ui/`.

**Architecture:** two new wrappers (`Button`, `SegmentedControl`) absorb
the duplicated markup. Color and focus tokens move into `styles.css`.
Everything else is a local edit to an existing component.

---

## Out of scope

- Any change to `src/lib/gear/` math or its results
- Any change to search params, `v`, tuple shape, or saved JSON
- New routes, new metrics, new features
- Third-party component, form, or icon libraries (ADR-001, ADR-002)
- Visual regression tooling
- Animation beyond color/border transitions
- Light/dark palette redesign — accent, ink, and paper hues stay

---

## Decisions locked with the user

1. Units and Theme become **real radio groups**, not `aria-pressed`
   buttons.
2. The single live region announces a **full sentence**.
3. Deleting a saved bike uses **inline two-step confirmation** — no
   timers, no undo path in the store.

---

## 1. Color tokens and contrast

### The failure

`#FF5A1F` on `#FAFAF8` measures **2.98:1**. WCAG AA needs 4.5:1 for text
below 18.66px. Every accent-colored string in light mode fails:

| Site | Current |
| --- | --- |
| `MetricCard.tsx:30` | skid warning, `text-sm text-accent` |
| `ChainPanel.tsx:37` | half-link warning, `text-sm text-accent` |
| `SavedPage.tsx:203` | import error, `text-sm text-accent`, `role="alert"` |
| `CompareTable.tsx:212` | "★ Best" badge, `text-xs text-accent` |

Separately, `bg-accent text-paper` on the selected toggle
(`UnitToggle.tsx:22`, `ThemeToggle.tsx:23`) is the same 2.98:1.

### The fix

Add one token. `#C2410C` on `#FAFAF8` measures **4.95:1**; the existing
`#FF5A1F` on `#111214` measures **6.01:1**. So light mode gets the darker
orange, dark mode keeps the brand orange.

```css
@theme {
  --color-accent: #ff5a1f;      /* fills, borders, graphics — unchanged */
  --color-accent-ink: #c2410c;  /* accent as text/outline on paper */
  --color-ink: #111214;
  --color-paper: #fafaf8;
}
```

Accent **as text** becomes `text-accent-ink dark:text-accent`. This
matches the existing `border-ink/10 dark:border-paper/15` idiom, so no
new mechanism is introduced.

Accent **as a fill** keeps `bg-accent` and switches its text to
`text-ink` — ink on `#FF5A1F` is **6.01:1** and mode-independent, since
the fill color does not change between modes.

Tinted backgrounds (`bg-accent/10`, `bg-accent/15` in `MetricCard`,
`CadenceTable`, `CompareTable`) are unchanged: the text on them stays
ink/paper and already passes.

Heatmap cell fills are data visualization, not text, and are out of
scope. The `outline-accent` current-cell marker stays as-is — it sits on
top of arbitrary data colors, where a mode-flipping token would not help.

## 2. Focus visibility

No custom control has a focus style; all of them inherit the UA default,
which is nearly invisible against an accent fill and differs per browser.

Add one Tailwind v4 utility in `styles.css`:

```css
@utility focus-ring {
  &:focus-visible {
    outline: 2px solid var(--color-accent-ink);
    outline-offset: 2px;
  }
  &:where(.dark, .dark *):focus-visible {
    outline-color: var(--color-accent);
  }
}
```

If `@utility` cannot express the dark variant, fall back to a plain
`.focus-ring` class in the same file — `styles.css` already hand-writes
`.skid-marker`, so a second bespoke class is consistent.

`focus-ring` goes on every interactive element: `Button`, `ToothInput`'s
range and number inputs, `CircumferenceInput`, every `select`, every
checkbox and radio, the `details` summary, the saved-name and rename
inputs, and heatmap cells. Outline (not ring/box-shadow) so it survives
`overflow-hidden` parents.

`SegmentedControl` is the one exception. Its real radio is `sr-only`, so
the focus indicator has to render on the sibling `<span>` through
`peer-focus-visible:` variants rather than the element's own
`:focus-visible`. It cannot reuse `focus-ring` and must spell the outline
out — matching its geometry and both accent tokens by hand.

## 3. `Button` wrapper

This exact string appears twelve times — `SavedPage` (×6),
`PresetChips`, `SkidSuggestions`, `CopyLinkButton`,
`CompareColumnHeader`, `SavedPage`'s submit:

```
rounded border border-ink/20 px-3 py-1.5 text-sm hover:border-accent dark:border-paper/20
```

`docs/05` line 56 says every wrapper lives in `src/components/ui/`. Add
`src/components/ui/Button.tsx` for the **inline action** shape only:

```ts
export interface ButtonProps {
  children: JSX.Element;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "default" | "danger";
  ariaLabel?: string;
}
```

- `default` — current appearance plus `focus-ring`,
  `transition-colors motion-reduce:transition-none`, and an
  `active:` state.
- `danger` — same geometry, `text-accent-ink dark:text-accent`, and
  `hover:border-accent`. Color is not the only signal: the danger button
  always pairs with the confirmation step in §6.

Deliberately **not** props: `size`, `full`, `align`, `disabled`. Nothing
in the app needs them (YAGNI). The card-shaped buttons in `PresetChips`,
`SkidSuggestions`, and `HeatmapCell` keep their own two-line layout and
only adopt `focus-ring` — forcing them through `Button` would require
exactly the props being omitted.

## 4. `SegmentedControl` wrapper

`UnitToggle` and `ThemeToggle` are structurally identical and use the
toggle-button pattern for what is single-select. `/explore` already uses
real radios (`HeatmapGrid.tsx:391`), so the app is internally
inconsistent.

Add `src/components/ui/SegmentedControl.tsx`: a `fieldset` with an
`sr-only` `<legend>`, and one visually-hidden `input[type=radio]` per
option whose sibling `<span>` carries the styling via `peer-checked:`.
Native radios give arrow-key navigation and correct semantics with no
JavaScript.

```ts
export interface SegmentedControlOption<T extends string> {
  id: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  legend: string;
  name: string;
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
}
```

Selected option: `bg-accent text-ink` (6.01:1, §1). End caps get
`first:rounded-l last:rounded-r` with `overflow-hidden rounded` on the
fieldset — this fixes the visible defect where the selected fill's square
corners poke past the rounded border.

`UnitToggle` and `ThemeToggle` become thin callers that own only their
option lists and store wiring.

**Test churn:** `CalculatorPage.test.tsx:89` and `:169` change from
`getByRole("button", { name: "Imperial" })` to
`getByRole("radio", { name: "Imperial" })`. There are no dedicated
`UnitToggle` or `ThemeToggle` test files, so that is the whole cost.

## 5. One live region

Five `MetricCard`s (`MetricCard.tsx:26`) plus `ChainPanel`
(`ChainPanel.tsx:30`) each carry `aria-live="polite"`. Dragging the
chainring slider makes six regions announce at once.

Remove `aria-live` from both. Add one `sr-only` polite region on the
calculator page, after the metric cards, whose text is a `createMemo`:

```text
Gear ratio 2.71, development 5.71 meters, 17 skid patches
```

Imperial swaps the middle clause to `71.6 gear inches`, following the
units toggle exactly as the hero card does.

The visible cards render `5.71 m` and `71.6″`, which a screen reader
either skips or mispronounces. Rather than doing string surgery on the
existing formatters, add spoken variants beside them in
`src/lib/format.ts` — `formatDevelopmentSpoken`, `formatGearInchesSpoken`
— so both spellings of a number come from one module and are unit
tested.

No debouncing: `aria-live="polite"` is defined to coalesce, and adding a
timer would be machinery this pass does not need.

`docs/05-ui-design.md:63` currently mandates per-card `aria-live` and
**must be amended** — the spec is the thing being changed here, not
violated.

## 6. Destructive delete

`SavedPage.tsx:278` deletes a saved bike on one click, with a button
visually identical to `Load`, `Rename`, and `Duplicate`.

Add a per-row confirming signal keyed by setup id. When armed, the row's
`Delete` is replaced in place by `Confirm delete` (`variant="danger"`)
and `Cancel`. `Escape` while armed cancels. Arming a different row
disarms the previous one — a single `createSignal<string | undefined>`
holding the armed id gives that for free.

`deleteSetup` in the store is unchanged. No timers, no restore path.

## 7. Heatmap keyboard navigation

All 299 cells are focusable buttons (`HeatmapGrid.tsx:418`), so crossing
the grid takes 299 Tab presses. This is the worst interaction problem in
the app.

Roving tabindex:

- Exactly one cell has `tabindex="0"`. It is the current bike's cell when
  `isInHeatmapWindow` is true, otherwise the top-left cell. All others
  get `tabindex="-1"`.
- `ArrowLeft`/`ArrowRight` move one chainring; `ArrowUp`/`ArrowDown` move
  one cog. Movement clamps at the edges — it does not wrap.
- `Home`/`End` jump to the first/last chainring in the current cog row.
- `Enter`/`Space` activate, which is native `<button>` behavior and
  already calls `onSelect`. Arrow keys move focus only and never
  navigate; committing on every arrow press would rewrite the URL
  repeatedly and lose the user's place.

Implementation: a `createSignal` holds the focused `ring/cog`, each cell
gets `data-cell="{ring}/{cog}"`, and the handler focuses
`container.querySelector('[data-cell="..."]')` through a `ref` callback
on the grid container. `SavedPage.tsx:187` already uses this `ref`
pattern, and it avoids `onMount`, which is forbidden.

**ARIA roles are deliberately not added.** The grid's rows use
`display: contents` (`HeatmapGrid.tsx:334`), which breaks the DOM
structure `role="grid"`/`role="row"`/`role="gridcell"` requires.
Restructuring the grid is a bigger change than this pass warrants, and
roving tabindex alone already turns 299 tab stops into one. Existing
per-cell `aria-label`s are unchanged.

For discoverability, an `sr-only` paragraph — "Use the arrow keys to move
between setups, then press Enter to open one in the calculator." — is
referenced by `aria-describedby` on the grid container.

## 8. Document and heading structure

- `/` has no `h1` and jumps straight to `h2` (`CalculatorPage.tsx:128`).
  Add `<h1 class="sr-only">Calculator</h1>`. A visible title would be
  noise above the metric cards, and `/compare`, `/explore`, and `/saved`
  already have visible `h1`s.
- `__root.tsx:33` renders the site name as a bare `<span>`. Make it a
  `Link` to `/` carrying the calculator search, so the wordmark behaves
  like every other site's home affordance.
- Add a skip link as the first focusable element in `__root.tsx`:
  `sr-only` until `:focus`, targeting `#main`. Add `id="main"` to the
  existing `<main>`.

## 9. Spacing and interaction rhythm

Small consistency pass, no layout restructuring:

- `<main>` gains `sm:p-6` alongside `p-4`; card padding stays `p-4`.
- Section gaps settle on `gap-8` between page sections and `gap-3`
  inside cards, matching what `CalculatorPage` already does.
- Every hover-reactive element gets
  `transition-colors motion-reduce:transition-none`. Color-only
  transitions, so the existing `prefers-reduced-motion` block in
  `styles.css` keeps its current scope.

## 10. Carried-over defects

Two items the v2 whole-branch review logged as Minor, plus dead files:

- `CalculatorPage.tsx:161-164` builds `SetupInputs`' `WheelSpec` for
  `PresetChips` without `circumferenceMm`, so preset subtitles compute
  gear inches from the bead-seat approximation while the cards above use
  the taped value. Spread `circ` into that memo.
- `CalculatorPage.tsx:241` and `:249` hardcode `25.4`. `MM_PER_INCH` is
  already exported from `~/lib/gear/calculations`. (The inline `25.4` in
  `chain.ts` stays — it is required by the documented import cycle.)
- `MetricCard`'s `warning?: boolean` makes a generic component hold
  skid-specific copy (`MetricCard.tsx:32`). Change to `warning?: string`
  and pass the sentence from the skid card's caller.
- `src/App.css` is 57 lines of unreferenced starter-template CSS: a
  `logo-spin` animation for the `src/logo.svg` that `main` already
  deleted, plus `.header`, `.increment`, and `.link`. Only
  `src/styles.css` is imported (`App.tsx:3`). Delete the file.

---

## File map

**Create**

- `src/components/ui/Button.tsx` + `Button.test.tsx`
- `src/components/ui/SegmentedControl.tsx` + `SegmentedControl.test.tsx`
- `src/lib/format.test.ts` — none exists today

**Delete**

- `src/App.css`

**Modify**

- `src/styles.css` — `--color-accent-ink`, `focus-ring` utility
- `src/routes/__root.tsx` — skip link, wordmark link, `id="main"`, padding
- `src/components/ui/UnitToggle.tsx`, `ThemeToggle.tsx` — use
  `SegmentedControl`
- `src/components/ui/MetricCard.tsx` — `warning?: string`, drop
  `aria-live`, accent-as-text token
- `src/components/ui/MetricCard.test.tsx` — `warning` now takes the
  sentence instead of a boolean (`:59`)
- `src/components/ui/CopyLinkButton.tsx`, `PresetChips.tsx`,
  `ToothInput.tsx`, `CircumferenceInput.tsx` — `Button` and/or
  `focus-ring`
- `src/lib/format.ts` — spoken number variants for the live region
- `src/components/calculator/ChainPanel.tsx` — drop `aria-live`, accent
  token
- `src/components/calculator/CalculatorPage.tsx` — `h1`, live region,
  `MM_PER_INCH`, `PresetChips` circ, skid warning text, `focus-ring`
- `src/components/skid/SkidSuggestions.tsx` — `focus-ring`
- `src/components/saved/SavedPage.tsx` — `Button`, inline delete confirm,
  accent token, `focus-ring`
- `src/components/compare/CompareTable.tsx`, `CompareColumnHeader.tsx`,
  `CompareView.tsx` — `Button`, accent token, `focus-ring`
- `src/components/explore/HeatmapGrid.tsx` — roving tabindex, arrow keys,
  `focus-ring`, sr-only instructions
- `src/components/calculator/CalculatorPage.test.tsx` — radio role,
  live-region and warning assertions
- `docs/05-ui-design.md` — amend the `aria-live` line, add `Button`,
  `SegmentedControl`, focus and contrast rules, heatmap keyboard model
- `docs/07-decisions-and-deployment.md` — ADR for the accent-ink token
  and the deliberate absence of heatmap grid roles; fix the broken ARIA
  bullet the v2 review flagged

---

## Constraints

- Solid 2.0 only. Forbidden: `createResource`, `batch`,
  `startTransition`, `useTransition`, `on`, `createComputed`, `produce`,
  `createMutable`, `onMount`, `classList`, `use:` directives, `<Index>`.
- `<For>` children receive accessors.
- No third-party component, form, or icon libraries. Native HTML +
  Tailwind wrappers in `src/components/ui/`.
- All domain math stays in `src/lib/gear/`. UI never contains formulas.
- Never store derived values in signals — always `createMemo`.
- Config changes go through `navigate({ search, replace: true })`.
- Search `v` stays `1`. **No search-param, tuple, or saved-JSON changes
  in this pass.**
- No new npm dependencies. Do not bump TanStack or `solid-js`. Keep the
  `package.json` `overrides`.
- Format and lint with Biome: `npm run format`, `npm run check`.
- 102 tests pass today. That number may only go up.

## Verification

- `npm run test`, `npm run check`, `npm run typecheck`, `npm run build`
- `grep -r "createResource\|classList\|produce\|onMount" src/` is empty
- No `aria-live` left in `MetricCard` or `ChainPanel`; exactly one in the
  calculator tree
- No occurrence of the twelve-times-duplicated button class string
- `bg-accent` is never paired with `text-paper`
- Tabbing across `/explore` reaches the grid in one stop, then arrow keys
  move within it
- Every interactive element shows a visible focus outline in both themes
