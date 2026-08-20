# v2 Street Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add chainstay → even/odd chain links and an optional taped tire
circumference to the v1 street calculator, without a sixth metric card.

**Architecture:** Pure `src/lib/gear/chain.ts` for stay → links. Optional
`WheelSpec.circumferenceMm` feeds existing `deriveMetrics`. Search `v`
stays `1`. Stay is global URL only (not on `DrivetrainConfig`). Circ maps
through config, compare tuples (optional 7th field), and saved JSON.

**Tech Stack:** Solid 2.0, TanStack Solid Router 2.0-rc, Vitest, TypeScript
7. Format with Prettier print width 80 on this branch. If `biome.json` is
already present, use `npm run check` / `npm run format` instead.

**Spec:** `docs/superpowers/specs/2026-08-20-v2-calculator-design.md`

## Global Constraints

- Solid 2.0 APIs only. Forbidden: `createResource`, `batch`,
  `startTransition`, `useTransition`, `on`, `createComputed`, `produce`,
  `createMutable`, `onMount`, `classList`, `use:` directives, `<Index>`.
- `<For>` children receive accessors: `{(item) => …}`.
- No third-party component or form libraries. Native HTML + Tailwind
  wrappers in `src/components/ui/`.
- All domain math in `src/lib/gear/` as pure functions with no framework
  imports. UI never contains formulas.
- Never store derived values in signals/stores — always `createMemo`.
- Config changes go through `navigate({ search, replace: true })`.
- Calculator search params are global; navigating between routes must
  spread them. Do not claim offline-first.
- Search `v` stays `1`. No PWA, accounts, 650c, free-form cranks,
  gear-inch target, track legality, or sixth metric card.
- Stay is not on `DrivetrainConfig`, compare tuples, or saved JSON.
- Never throw. Stay clamps. Bad circ becomes unset. No new npm
  dependencies.
- Do not bump TanStack or solid-js. Do not remove package.json
  `overrides`.
- Exact warning copy: “Even chain won’t tension well. Use a half-link, or
  change ring or cog by 2 teeth.” (unicode apostrophe in won’t)
- Exact chain tooltip: “Chain length in ½″ links: 2 × chainstay (inches) +
  (ring + cog) / 4 + 0.5, then round. Connecting-pin chains want an even
  count. An odd count needs a half-link.”
- Taped-circ tooltip: “Using a taped circumference of {n} mm. Clear the
  field to return to bead-seat plus twice the tire width.”
- Seed: 46/17 stay 410 → even 98, odd 97, warning on. Unset circ: 700×25
  still 2.1112 m and 30.85 km/h at 90 rpm.

---

## File map

- Create: `src/lib/gear/chain.ts`, `src/lib/gear/chain.test.ts`,
  `src/components/calculator/ChainPanel.tsx`
- Modify: `src/lib/gear/types.ts` (`circumferenceMm?` on `WheelSpec`)
- Modify: `src/lib/gear/wheels.ts` (measured circ path)
- Modify: `src/lib/gear/calculations.test.ts` (circ development)
- Modify: `src/lib/search.ts` (`stay`, `circ`, tuples, `applySearchPatch`)
- Modify: `src/lib/search.test.ts`
- Modify: `src/components/compare/CompareView.tsx` (`bikeFromSearch`)
- Modify: `src/lib/state/saved-store.ts` (clone/parse circ)
- Modify: `src/lib/state/saved-store.test.ts`
- Modify: `src/components/calculator/CalculatorPage.tsx`
- Modify: `src/components/calculator/CalculatorPage.test.tsx`
- Modify: `src/components/saved/SavedPage.tsx` (load keeps current stay)
- Modify: `src/components/compare/CompareColumnHeader.tsx`
- Modify: `src/components/compare/CompareColumnHeader.test.tsx`
- Modify: `src/routes/__root.test.tsx` (preserve stay + circ)
- Modify: `docs/00`, `docs/02`, `docs/03`, `docs/04`, `docs/05`,
  `docs/06`, `docs/07`

`chain.ts` must **not** import `calculations.ts` or `wheels.ts` (cycle:
calculations → wheels → chain → calculations). Use `25.4` inline; it
must match `MM_PER_INCH`.

---

### Task 1: Chain length math

**Files:**
- Create: `src/lib/gear/chain.test.ts`
- Create: `src/lib/gear/chain.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `STAY_MIN_MM`, `STAY_MAX_MM`, `STAY_DEFAULT_MM`,
  `CIRC_MIN_MM`, `CIRC_MAX_MM`, `ChainLength`, `nearestEvenLinks`,
  `nearestOddLinks`, `chainLength(stayMm, ring, cog)`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import {
  chainLength,
  nearestEvenLinks,
  nearestOddLinks,
} from "./chain";

describe("nearest parity", () => {
  it("picks the lower neighbor on a tie", () => {
    expect(nearestEvenLinks(97)).toBe(96);
    expect(nearestOddLinks(97)).toBe(97);
    expect(nearestEvenLinks(97.5)).toBe(98);
    expect(nearestOddLinks(97.5)).toBe(97);
  });
});

describe("chainLength", () => {
  it("warns on 46/17 at 410 mm stay", () => {
    const c = chainLength(410, 46, 17);
    expect(c.rawLinks).toBeCloseTo(97.067, 3);
    expect(c.evenLinks).toBe(98);
    expect(c.oddLinks).toBe(97);
    expect(c.halfLinkCloser).toBe(true);
  });

  it("does not warn on 46/17 at 405 mm stay", () => {
    const c = chainLength(405, 46, 17);
    expect(c.evenLinks).toBe(96);
    expect(c.oddLinks).toBe(97);
    expect(c.halfLinkCloser).toBe(false);
  });

  it("does not warn at the even/odd midpoint", () => {
    expect(
      Math.abs(97.5 - nearestOddLinks(97.5)) <
        Math.abs(97.5 - nearestEvenLinks(97.5)),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/gear/chain.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

`src/lib/gear/chain.ts`:

```ts
export const STAY_MIN_MM = 350;
export const STAY_MAX_MM = 450;
export const STAY_DEFAULT_MM = 410;
export const CIRC_MIN_MM = 1800;
export const CIRC_MAX_MM = 2500;

export interface ChainLength {
  rawLinks: number;
  evenLinks: number;
  oddLinks: number;
  halfLinkCloser: boolean;
}

function nearestParity(raw: number, even: boolean): number {
  const rounded = Math.round(raw);
  const isEven = rounded % 2 === 0;
  if (isEven === even) return rounded;
  const down = rounded - 1;
  const up = rounded + 1;
  return raw - down <= up - raw ? down : up;
}

export function nearestEvenLinks(raw: number): number {
  return nearestParity(raw, true);
}

export function nearestOddLinks(raw: number): number {
  return nearestParity(raw, false);
}

export function chainLength(
  stayMm: number,
  ring: number,
  cog: number,
): ChainLength {
  const stayIn = stayMm / 25.4;
  const lengthIn = 2 * stayIn + (ring + cog) / 4 + 0.5;
  const rawLinks = lengthIn / 0.5;
  const evenLinks = nearestEvenLinks(rawLinks);
  const oddLinks = nearestOddLinks(rawLinks);
  return {
    rawLinks,
    evenLinks,
    oddLinks,
    halfLinkCloser:
      Math.abs(rawLinks - oddLinks) < Math.abs(rawLinks - evenLinks),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/gear/chain.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/gear/chain.ts src/lib/gear/chain.test.ts
git commit -m "feat: compute even and odd chain links from stay"
```

---

### Task 2: Measured circumference in wheel math

**Files:**
- Modify: `src/lib/gear/types.ts`
- Modify: `src/lib/gear/wheels.ts`
- Modify: `src/lib/gear/calculations.test.ts`

**Interfaces:**
- Consumes: `CIRC_MIN_MM`, `CIRC_MAX_MM` from `chain.ts`
- Produces: optional `WheelSpec.circumferenceMm`;
  `wheelDiameterMm` / `wheelCircumferenceM` use `C_m = circ/1000`,
  `D_mm = circ/π` when circ is an integer in range

- [ ] **Step 1: Write the failing tests** (add to `calculations.test.ts`)

```ts
it("uses taped circumference when set", () => {
  const taped = {
    ...street,
    wheel: { ...wheel700x25, circumferenceMm: 2130 },
  };
  const unset = deriveMetrics(street);
  const set = deriveMetrics(taped);
  expect(set.developmentMeters).toBeCloseTo((46 / 17) * 2.13, 5);
  expect(set.wheelDiameterMm).toBeCloseTo(2130 / Math.PI, 5);
  expect(set.skidPatches).toBe(unset.skidPatches);
  expect(set.developmentMeters).not.toBeCloseTo(
    unset.developmentMeters,
    5,
  );
});
```

Keep the existing 2.1112 / 30.85 tests; they must still pass.

- [ ] **Step 2: Run the new test to verify it fails**

Run: `npx vitest run src/lib/gear/calculations.test.ts`

Expected: FAIL (circumference ignored)

- [ ] **Step 3: Implement**

`types.ts` — add `circumferenceMm?: number` to `WheelSpec`.

In `wheels.ts` import `{ CIRC_MAX_MM, CIRC_MIN_MM } from "./chain"`.
Add:

```ts
function measuredCircumferenceMm(wheel: WheelSpec): number | undefined {
  const n = wheel.circumferenceMm;
  if (
    typeof n !== "number" ||
    !Number.isInteger(n) ||
    n < CIRC_MIN_MM ||
    n > CIRC_MAX_MM
  ) {
    return undefined;
  }
  return n;
}

export function wheelDiameterMm(wheel: WheelSpec): number {
  const circ = measuredCircumferenceMm(wheel);
  if (circ !== undefined) return circ / Math.PI;
  return wheel.beadSeatDiameterMm + 2 * wheel.tireWidthMm;
}

export function wheelCircumferenceM(wheel: WheelSpec): number {
  const circ = measuredCircumferenceMm(wheel);
  if (circ !== undefined) return circ / 1000;
  return (Math.PI * wheelDiameterMm(wheel)) / 1000;
}
```

Do not change `deriveMetrics` itself.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/gear/calculations.test.ts src/lib/gear/chain.test.ts`

Expected: PASS (including 2.1112 and 30.85)

- [ ] **Step 5: Commit**

```bash
git add src/lib/gear/types.ts src/lib/gear/wheels.ts src/lib/gear/calculations.test.ts
git commit -m "feat: honor optional taped wheel circumference"
```

---

### Task 3: Search parser, tuples, patch helper

**Files:**
- Modify: `src/lib/search.ts`
- Modify: `src/lib/search.test.ts`
- Modify: `src/components/compare/CompareView.tsx`

**Interfaces:**
- Consumes: stay/circ constants; `toConfig`/`fromConfig` circ mapping
- Produces: `CalculatorSearch.stay`, optional `circ`,
  `parseCirc`, `applySearchPatch`, 6- or 7-part tuples

- [ ] **Step 1: Write the failing tests** (extend `search.test.ts`)

Update the empty-input expectation to include `stay: 410` and assert
`expect(parseCalculatorSearch({})).not.toHaveProperty("circ")`.

Add:

```ts
it("clamps stay and omits invalid circ", () => {
  expect(parseCalculatorSearch({ stay: 300 }).stay).toBe(350);
  expect(parseCalculatorSearch({ stay: 500 }).stay).toBe(450);
  expect(parseCalculatorSearch({ circ: 1000 })).not.toHaveProperty("circ");
  expect(parseCalculatorSearch({ circ: "foo" })).not.toHaveProperty("circ");
  expect(parseCalculatorSearch({ circ: 2130 }).circ).toBe(2130);
});

it("parses a 7-part compare tuple and rejects other lengths", () => {
  const seven = parseCompareTuple("48,16,700c,25,167.5,0,2130");
  expect(seven?.wheel.circumferenceMm).toBe(2130);
  expect(parseCompareTuple("48,16,700c,25,170")).toBeUndefined();
  const six = parseCompareTuple("48,16,700c,25,167.5,0");
  expect(six?.wheel.circumferenceMm).toBeUndefined();
});

it("formats six fields without circ and seven with", () => {
  const bike = parseCalculatorSearch({});
  expect(formatCompareTuple(toConfig(bike))).toBe("46,17,700c,25,170,0");
  const taped = parseCalculatorSearch({ circ: 2130 });
  expect(formatCompareTuple(toConfig(taped))).toBe(
    "46,17,700c,25,170,0,2130",
  );
});

it("applySearchPatch deletes circ when set to undefined", () => {
  const prev = parseCalculatorSearch({ circ: 2130, stay: 420 });
  const next = applySearchPatch(prev, { circ: undefined });
  expect(next).not.toHaveProperty("circ");
  expect(next.stay).toBe(420);
});
```

Keep existing 6-field seed tests (`"46,18,700c,25,170,0"`).
`fromConfig(toConfig(defaultSearch))` must still equal the default
search (`stay: 410`, no circ).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/search.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement**

Export `parseCirc` from `search.ts`:

```ts
export function parseCirc(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) return undefined;
  if (n < CIRC_MIN_MM || n > CIRC_MAX_MM) return undefined;
  return n;
}
```

`parseCalculatorSearch` always sets `stay` via
`clampInt(s.stay, STAY_MIN_MM, STAY_MAX_MM, STAY_DEFAULT_MM)`. Assign
`circ` only when `parseCirc` returns a number.

`toConfig`: if `search.circ !== undefined`, set
`wheel.circumferenceMm: search.circ`.

`fromConfig`: always `stay: STAY_DEFAULT_MM`. If
`parseCirc(config.wheel.circumferenceMm)` is defined, set `circ`.

`formatCompareTuple`: six fields, plus `s.circ` when defined.

`parseCompareTuple`: `parts.length === 6 || parts.length === 7`; pass
`circ: parts[6]` when length is 7; any other length → `undefined`.

```ts
export function applySearchPatch(
  prev: CalculatorSearch,
  partial: Partial<CalculatorSearch>,
): CalculatorSearch {
  const next: CalculatorSearch = { ...prev, ...partial };
  if ("circ" in partial && partial.circ === undefined) {
    delete next.circ;
  }
  return next;
}
```

`CompareView.bikeFromSearch` must copy `stay` and, when present, `circ`.
Otherwise compare commits drop the new keys.

Fix any hand-built `CalculatorSearch` literals missing `stay`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/search.test.ts && npm run typecheck`

Expected: PASS / clean

- [ ] **Step 5: Commit**

```bash
git add src/lib/search.ts src/lib/search.test.ts src/components/compare/CompareView.tsx
git commit -m "feat: parse stay and optional circ in calculator search"
```

---

### Task 4: Saved setups persist circ, not stay

**Files:**
- Modify: `src/lib/state/saved-store.ts`
- Modify: `src/lib/state/saved-store.test.ts`
- Modify: `src/components/saved/SavedPage.tsx`

**Interfaces:**
- Consumes: `parseCirc` from `search.ts`
- Produces: clone/parse copies valid `circumferenceMm`; invalid circ
  dropped; load keeps current URL stay

- [ ] **Step 1: Write the failing tests**

```ts
it("round-trips optional circumferenceMm and drops invalid circ", () => {
  const taped = toConfig(parseCalculatorSearch({ circ: 2130 }));
  saveSetup("Taped", taped);
  reloadSavedFromStorage();
  expect(saved.setups[0]?.config.wheel.circumferenceMm).toBe(2130);
  expect(JSON.stringify(exportSaved())).not.toMatch(/"stay"/);

  const result = importSaved({
    v: 1,
    setups: [
      {
        id: "keep",
        name: "Bad circ",
        savedAt: "2026-08-20T12:00:00.000Z",
        config: {
          ...SAMPLE,
          wheel: { ...SAMPLE.wheel, circumferenceMm: 1000 },
        },
      },
    ],
  });
  expect(result.ok).toBe(true);
  expect(
    saved.setups.find((s) => s.id === "keep")?.config.wheel
      .circumferenceMm,
  ).toBeUndefined();
});
```

Existing `{ v: 2, setups: [] }` refusal must still pass.

- [ ] **Step 2: Run tests to verify new ones fail**

Run: `npx vitest run src/lib/state/saved-store.test.ts`

- [ ] **Step 3: Implement**

`cloneConfig` copies `circumferenceMm` only when it is `!== undefined`.

`parseConfig`: after required checks succeed, if `wheel.circumferenceMm`
is present, set it only when `parseCirc` accepts it. Never reject the
whole bike for a bad circ.

`SavedPage`:

```ts
onLoad={(bike) => {
  void go({
    to: "/",
    search: { ...bike, stay: search().stay },
  });
}}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/state/saved-store.test.ts src/components/saved/SavedPage.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/state/saved-store.ts src/lib/state/saved-store.test.ts src/components/saved/SavedPage.tsx
git commit -m "feat: persist taped circumference on saved setups"
```

---

### Task 5: Calculator inputs and chain panel

**Files:**
- Create: `src/components/calculator/ChainPanel.tsx`
- Modify: `src/components/calculator/CalculatorPage.tsx`
- Modify: `src/components/calculator/CalculatorPage.test.tsx`

**Interfaces:**
- Consumes: `chainLength`, `applySearchPatch`, `ToothInput`, `Tooltip`,
  `prefs.units`
- Produces: circ + stay inputs; chain panel after skid; five cards
  unchanged; taped tooltips when circ set

- [ ] **Step 1: Write the failing tests**

In `renderCalculator`, patch with `applySearchPatch`. Add:

```ts
it("shows 98 links and the half-link warning on the default bike", () => {
  const { getByText } = renderCalculator();
  expect(getByText("98 links")).toBeTruthy();
  expect(getByText(/won’t tension well/i)).toBeTruthy();
  expect(getByText(/97 with a half-link/)).toBeTruthy();
});

it("omits circ from search when the circumference field is cleared", () => {
  const { getByRole, search } = renderCalculator(
    parseCalculatorSearch({ circ: 2130 }),
  );
  const input = getByRole("spinbutton", {
    name: "Measured circumference",
  });
  fireEvent.change(input, { target: { value: "" } });
  flush();
  expect(search()).not.toHaveProperty("circ");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/calculator/CalculatorPage.test.tsx`

- [ ] **Step 3: Implement**

Patch via `applySearchPatch(prev, partial)` with `replace: true`.

`SetupInputs` order: chainring, cog, wheel, tire, circ, crank, stay,
ambi, presets.

Circ: native `input[type=number]`, `aria-label="Measured circumference"`,
placeholder `optional`, `value={props.bike.circ ?? ""}`. Empty string →
`onPatch({ circ: undefined })`. Integer → `onPatch({ circ: n })`.

Stay metric: `ToothInput` `label="Chainstay"` min 350 max 450 unit `mm`.
Stay imperial: min 13.8 max 17.7 step 0.1 unit `in`, value
`Number((props.bike.stay / 25.4).toFixed(1))`, onChange
`(inches) => onPatch({ stay: clampInt(inches * 25.4, 350, 450, 410) })`.

When `circ` is set, development, gear inches, and gain tooltips are:
`Using a taped circumference of ${n} mm. Clear the field to return to bead-seat plus twice the tire width.`

`ChainPanel` after skid + Improve this. Heading `Chain`. Value
`` `${even} links` `` with `aria-live="polite"`. Line
`` `${odd} with a half-link` ``. Warning copy and tooltip exactly as
Global Constraints. `createMemo` → `chainLength(stay, ring, cog)`.

Still exactly five `MetricCard`s. No formulas in the UI file.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/calculator/CalculatorPage.test.tsx && npm run typecheck`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/calculator/ChainPanel.tsx src/components/calculator/CalculatorPage.tsx src/components/calculator/CalculatorPage.test.tsx
git commit -m "feat: show chain links and optional taped circumference"
```

---

### Task 6: Compare compact circ

**Files:**
- Modify: `src/components/compare/CompareColumnHeader.tsx`
- Modify: `src/components/compare/CompareColumnHeader.test.tsx`
- Modify: `src/components/compare/CompareView.tsx`

**Interfaces:**
- Consumes: `applySearchPatch`, circ input pattern from Task 5
- Produces: compact circ after tire; no stay; no chain row

- [ ] **Step 1: Write the failing test**

```ts
it("has a measured circumference field and no chainstay", () => {
  const { getByRole, queryByRole } = /* existing header render */;
  expect(
    getByRole("spinbutton", { name: "Measured circumference" }),
  ).toBeTruthy();
  expect(queryByRole("spinbutton", { name: "Chainstay value" })).toBeNull();
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/components/compare/CompareColumnHeader.test.tsx`

- [ ] **Step 3: Implement**

Same circ input after tire, before crank. c1 `onChange` uses
`applySearchPatch(bike(), partial)`. No stay control. No chain row in
the compare table.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/compare && npm run typecheck`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/compare
git commit -m "feat: edit taped circumference in compare headers"
```

---

### Task 7: Nav preservation, docs, verify

**Files:**
- Modify: `src/routes/__root.test.tsx`
- Modify: `docs/00-project-overview.md`, `docs/02-domain-model.md`,
  `docs/03-features.md`, `docs/04-state-and-routing.md`,
  `docs/05-ui-design.md`, `docs/06-testing.md`,
  `docs/07-decisions-and-deployment.md`

**Interfaces:**
- Consumes: `Link search={bike}` already spreads parsed search
- Produces: passing nav test; docs match the spec

- [ ] **Step 1: Write the nav test**

```ts
it("preserves stay and circ from / to /explore", async () => {
  const { getByRole, testRouter } = await renderAt(
    "/?chainring=48&cog=16&stay=405&circ=2130",
  );
  fireEvent.click(getByRole("link", { name: "Explore" }));
  flush();
  await testRouter.load();
  flush();
  await vi.waitFor(() => {
    expect(testRouter.state.location.pathname).toBe("/explore");
  });
  expect(testRouter.state.location.search).toMatchObject({
    chainring: 48,
    cog: 16,
    stay: 405,
    circ: 2130,
  });
});
```

- [ ] **Step 2: Run the nav test**

Run: `npx vitest run src/routes/__root.test.tsx`

If stay/circ are stripped, fix `__root` Link `search` to spread `bike()`.

- [ ] **Step 3: Update docs**

- `docs/00`: v2 (this build) = chain length + taped circ. Deferred:
  PWA, accounts, 650c, free-form cranks, gear-inch target, track
  legality.
- `docs/02`: optional `circumferenceMm`; chain.ts formulas; stay not on
  `DrivetrainConfig`.
- `docs/03`: F1 circ under tire, stay after crank, chain panel after
  skid; five cards.
- `docs/04`: `stay`, optional `circ`, 6- or 7-part tuples.
- `docs/05`: wireframe circ/stay + chain panel below skid.
- `docs/06`: chain and circ cases from the spec.
- `docs/07`: measured circumference implemented as optional `circ`;
  approximation remains the default.

Do not rewrite `docs/08-seed-code.md`. Do not claim offline-first.

- [ ] **Step 4: Full verification**

```bash
npm run test
npm run typecheck
npm run build
```

Format touched files with Prettier print width 80 (or Biome if present).
`grep -r "createResource\|classList\|produce" src/` must be empty.

Expected: tests pass, typecheck clean, `dist/client` emitted.

- [ ] **Step 5: Commit**

```bash
git add src/routes/__root.test.tsx docs/00-project-overview.md docs/02-domain-model.md docs/03-features.md docs/04-state-and-routing.md docs/05-ui-design.md docs/06-testing.md docs/07-decisions-and-deployment.md
git commit -m "docs: record v2 stay, chain links, and taped circumference"
```

---

## Self-review

1. **Spec coverage:** chain math, circ, search, tuples, saved, calculator
   UI, compare circ, nav, docs each have a task. Out-of-scope items have
   no tasks.
2. **Placeholders:** none.
3. **Types:** `stay` required on `CalculatorSearch`; `circ` optional;
   `fromConfig` always emits `stay: 410`; `bikeFromSearch` copies stay +
   circ; `applySearchPatch` deletes `circ`; SavedPage overlays current
   stay on load.
