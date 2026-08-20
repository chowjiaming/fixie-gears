# Fixie Gears v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the v1 Fixie Gears SPA: local gear math, URL-as-source-of-truth calculator, skid visualizer, compare, explore, saved setups, units/theme.

**Architecture:** Solid 2.0 client-only SPA. Pure domain math in `src/lib/gear/` (no framework imports). Calculator search params on every route. Prefs and saved setups in Solid stores + localStorage. Derived metrics are always `createMemo`, never stored.

**Tech Stack:** solid-js 2.0 RC, @tanstack/solid-router 2.0.0-rc.x, Tailwind 4, Vitest, Netlify static (`dist/client`).

## Global Constraints

- Solid 2.0 APIs only. Forbidden: `createResource`, `batch`, `startTransition`, `useTransition`, `on`, `createComputed`, `produce`, `createMutable`, `onMount`, `classList`, `use:` directives, `<Index>`.
- `<For>` children receive accessors: `{(item) => ...}` with `item()`.
- No third-party component or form libraries (ADR-001, ADR-002). Native HTML + Tailwind wrappers in `src/components/ui/`.
- Domain math only in `src/lib/gear/`. UI never contains formulas. No `any`. Narrow `unknown` with a type guard.
- Never store derived values in signals/stores — always `createMemo`.
- Config writes go through `navigate({ search, replace: true })`.
- Calculator search keys (`v`, `chainring`, `cog`, `wheel`, `tire`, `crank`, `ambi`) are global on every route.
- Wheel ids: `"700c" | "650b" | "26in"`. Unknown (including `"650c"`) → `"700c"`.
- Tire 18–50 mm (default 25). Chainring 20–80 (default 46). Cog 9–30 (default 17).
- Cranks: `165 | 167.5 | 170 | 172.5 | 175` via `snapCrankMm` (not `clampInt`). Default 170. Ties toward 170.
- Skid: `cog / gcd(ring, cog)`; ×2 only if ambidextrous AND chainring is odd. Warn at `skidPatches ≤ 2`.
- `GOOD_SKID_PATCHES = 8`. Suggestions: ±2 teeth, more patches than now; prefer ≥8 with smallest ratio delta; else max patches.
- Five metric cards (no rollout card). Hero length follows units (default **metric**). Cadence table: one speed column, 90 rpm highlighted.
- Visualizer two-color only when ambi AND odd ring.
- Compare: `c2`/`c3`/`c4` compact tuples; 0 extras seed cog±1; `c2` only stays 2 columns; no 1-column compare; best highlight on skid only.
- Explore grid 38–60 × 11–23; `metric=gi|dev|skid` (default `gi`); `minSkid=0|8`; diverging scale centered on current setup.
- Saved: `{ id, name, savedAt, config }`. Load → `/`. Import `{ v: 1, setups }` merges; unknown `v` refuses. No drag-reorder.
- Do not claim offline-first in UI or README. Do not add dependencies except Prettier in Task 1 (already required by AGENTS.md).
- Do not run `npm update` on TanStack packages. Keep `overrides` for solid-js / @solidjs/web.
- Format with Prettier, print width 80.
- `@tanstack/solid-router` stays on 2.0.0-rc.x. Task 1 copies seed tests and implementation together (do not TDD that milestone).
- Comments explain why, never what. JSDoc on exports only for non-obvious intent.

## File map

| Path | Responsibility |
| --- | --- |
| `src/lib/gear/*` | Pure math, types, wheel table, skid, tests |
| `src/lib/search.ts` | Shared calculator search + compare/explore parsers |
| `src/lib/format.ts` | Number/unit display |
| `src/lib/state/prefs-store.ts` | Units + theme, localStorage `fixie:prefs` |
| `src/lib/state/saved-store.ts` | Saved setups, localStorage `fixie:saved` |
| `src/lib/state/setup-store.ts` | `useCurrentSetup()` memos |
| `src/routes/*` | File routes |
| `src/components/ui/*` | Native wrappers |
| `src/components/calculator/*` | F1 |
| `src/components/skid/*` | F2 |
| `src/components/compare/*` | F3 |
| `src/components/explore/*` | F4 |
| `src/router.tsx`, `src/App.tsx`, `src/Document.tsx` | Shell |
| `src/styles.css` | Tailwind entry |

---

### Task 1: Domain math seed + test runner

**Files:**
- Create: `src/lib/gear/types.ts`
- Create: `src/lib/gear/wheels.ts`
- Create: `src/lib/gear/skid.ts`
- Create: `src/lib/gear/calculations.ts`
- Create: `src/lib/gear/calculations.test.ts`
- Create: `.prettierrc.json`
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`

**Interfaces:**
- Consumes: nothing from later tasks
- Produces: all exports in `docs/08-seed-code.md` (`clampInt`, `snapCrankMm`, `deriveMetrics`, `skidPatchCount`, `suggestSkidImprovements`, `parseWheelSize`, `WHEEL_SIZES`, `PRESETS`, `GOOD_SKID_PATCHES`, `ALLOWED_CRANKS_MM`, types)

- [ ] **Step 1: Wire Vitest, path alias `~`, Prettier, package name**

`package.json`: set `"name": "fixie-gears"`. Add scripts (keep existing ones):

```json
"test": "vitest run",
"test:watch": "vitest"
```

Add `prettier` as a **devDependency** (do not bump TanStack or solid-js). After editing, run `npm install prettier --save-dev` so the lockfile updates. Do not run `npm update`.

`.prettierrc.json`:

```json
{
  "printWidth": 80
}
```

`tsconfig.json` — add to `compilerOptions`:

```json
"baseUrl": ".",
"paths": {
  "~/*": ["./src/*"]
}
```

`vite.config.ts` — add `~` alias and Vitest jsdom. Keep existing plugins/order. Use this full file:

```ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    ...(process.env.VITEST
      ? []
      : [tanstackRouter({ target: "solid", autoCodeSplitting: true })]),
    solid({ start: true }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
    assetsInlineLimit: 0,
  },
  test: {
    environment: "jsdom",
  },
});
```

If TypeScript complains about `test`, add `/// <reference types="vitest/config" />` at the top of `vite.config.ts`.

- [ ] **Step 2: Copy seed files verbatim from `docs/08-seed-code.md`**

Open `/home/chowjiaming/code/fixie-gears/docs/08-seed-code.md`. For each `## \`src/lib/gear/...\`` heading, create that file with **exactly** the TypeScript inside the following fenced block. Do not retype from memory. Do not "improve" the math. Do not add files not listed.

- [ ] **Step 3: Run tests (expect pass)**

Run: `npm run test`

Expected: Vitest runs `src/lib/gear/calculations.test.ts` and all tests pass.

Circumference and 90 rpm speed literals must match `Math.PI` (`2.1112` at 4 dp, `30.85` km/h at 2 dp), not the coarser-π values `2.1108` / `30.84`. If a copy fails for any other reason, fix the copy.

Known assertions that must pass:

- `wheelCircumferenceM(700×25)` ≈ `2.1112` (4 dp)
- 90 rpm on 46/17 700×25c ≈ `30.85` km/h (2 dp)

- `skidPatchCount(48, 16, true) === 1`
- `skidPatchCount(46, 17, true) === 17`
- `skidPatchCount(49, 16, true) === 32`
- `suggestSkidImprovements(48/16)` first result is `{ chainringTeeth: 50, cogTeeth: 17, skidPatches: 17 }`
- `snapCrankMm(167.5) === 167.5`, `snapCrankMm(168) === 167.5`, `snapCrankMm(168.75) === 170`
- `parseWheelSize("650c") === "700c"`
- `wheelDiameterMm({ beadSeatDiameterMm: 584, tireWidthMm: 23 }) === 630`

- [ ] **Step 4: Format**

Run: `npx prettier --write src/lib/gear package.json vite.config.ts tsconfig.json .prettierrc.json`

If Prettier changes the seed files, keep those formatting-only changes. Do not change logic.

- [ ] **Step 5: Commit**

```bash
git add src/lib/gear package.json package-lock.json vite.config.ts tsconfig.json .prettierrc.json
git commit -m "$(cat <<'EOF'
feat: add gear math seed and vitest runner

Copy the domain layer from the spec so skid, cranks, and wheels are
testable before any UI.
EOF
)"
```

---

### Task 2: Shared search + routing skeleton

**Files:**
- Create: `src/lib/search.ts`
- Create: `src/lib/search.test.ts`
- Create: `src/lib/state/setup-store.ts`
- Create: `src/routes/__root.tsx`
- Create: `src/routes/index.tsx`
- Create: `src/routes/compare.tsx`
- Create: `src/routes/explore.tsx`
- Create: `src/routes/saved.tsx`
- Create: `src/router.tsx`
- Create: `src/styles.css`
- Modify: `src/App.tsx`
- Modify: `src/Document.tsx`

**Interfaces:**
- Consumes: `clampInt`, `snapCrankMm` from `~/lib/gear/calculations`; `parseWheelSize`, `WHEEL_SIZES` from `~/lib/gear/wheels`; `DrivetrainConfig` from `~/lib/gear/types`; `deriveMetrics` from `~/lib/gear/calculations`
- Produces: `CalculatorSearch`, `parseCalculatorSearch`, `toConfig`, `parseCompareTuple`, `compactCompareExtras`, `seedCompareExtras`, `parseExploreSearch`, `useCurrentSetup`; file routes for `/`, `/compare`, `/explore`, `/saved`

- [ ] **Step 1: Write failing search tests**

Create `src/lib/search.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  compactCompareExtras,
  parseCalculatorSearch,
  parseCompareTuple,
  parseExploreSearch,
  seedCompareExtras,
  toConfig,
} from "./search";

describe("parseCalculatorSearch", () => {
  it("applies defaults on empty input", () => {
    expect(parseCalculatorSearch({})).toEqual({
      v: 1,
      chainring: 46,
      cog: 17,
      wheel: "700c",
      tire: 25,
      crank: 170,
      ambi: 0,
    });
  });

  it("keeps half-mm cranks and maps 650c to 700c", () => {
    const s = parseCalculatorSearch({
      chainring: "48",
      cog: "16",
      wheel: "650c",
      tire: "28",
      crank: "167.5",
      ambi: "1",
    });
    expect(s.chainring).toBe(48);
    expect(s.cog).toBe(16);
    expect(s.wheel).toBe("700c");
    expect(s.tire).toBe(28);
    expect(s.crank).toBe(167.5);
    expect(s.ambi).toBe(1);
  });
});

describe("compare extras", () => {
  it("parses a compact tuple", () => {
    const cfg = parseCompareTuple("48,16,700c,25,167.5,0");
    expect(cfg?.chainringTeeth).toBe(48);
    expect(cfg?.cogTeeth).toBe(16);
    expect(cfg?.wheel.beadSeatDiameterMm).toBe(622);
    expect(cfg?.crankLengthMm).toBe(167.5);
    expect(cfg?.ambidextrousSkidder).toBe(false);
  });

  it("compacts holes c3-without-c2 into c2", () => {
    expect(compactCompareExtras({ c3: "48,16,700c,25,170,0" })).toEqual({
      c2: "48,16,700c,25,170,0",
    });
  });

  it("seeds cog±1 when no extras remain", () => {
    const bike = parseCalculatorSearch({ cog: 17 });
    const seeded = seedCompareExtras(bike, {});
    expect(seeded.c2).toBe("46,18,700c,25,170,0");
    expect(seeded.c3).toBe("46,16,700c,25,170,0");
    expect(seeded.c4).toBeUndefined();
  });

  it("does not seed c3 when only c2 is present", () => {
    const bike = parseCalculatorSearch({});
    const extras = seedCompareExtras(bike, { c2: "52,14,700c,25,170,0" });
    expect(extras.c2).toBe("52,14,700c,25,170,0");
    expect(extras.c3).toBeUndefined();
  });
});

describe("parseExploreSearch", () => {
  it("defaults metric gi and minSkid 0", () => {
    expect(parseExploreSearch({})).toEqual({ metric: "gi", minSkid: 0 });
  });

  it("accepts minSkid 8", () => {
    expect(parseExploreSearch({ metric: "skid", minSkid: "8" })).toEqual({
      metric: "skid",
      minSkid: 8,
    });
  });
});

describe("toConfig", () => {
  it("maps wheel id and tire into WheelSpec", () => {
    const cfg = toConfig(parseCalculatorSearch({}));
    expect(cfg.wheel).toEqual({ beadSeatDiameterMm: 622, tireWidthMm: 25 });
    expect(cfg.chainringTeeth).toBe(46);
    expect(cfg.cogTeeth).toBe(17);
    expect(cfg.crankLengthMm).toBe(170);
    expect(cfg.ambidextrousSkidder).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect fail**

Run: `npx vitest run src/lib/search.test.ts`

Expected: FAIL because `./search` does not exist.

- [ ] **Step 3: Implement `src/lib/search.ts`**

```ts
import { clampInt, snapCrankMm } from "~/lib/gear/calculations";
import type { DrivetrainConfig, WheelSizeId } from "~/lib/gear/types";
import { parseWheelSize, WHEEL_SIZES } from "~/lib/gear/wheels";

export interface CalculatorSearch {
  v: 1;
  chainring: number;
  cog: number;
  wheel: WheelSizeId;
  tire: number;
  crank: number;
  ambi: 0 | 1;
}

export interface CompareExtras {
  c2?: string;
  c3?: string;
  c4?: string;
}

export interface ExploreSearch {
  metric: "gi" | "dev" | "skid";
  minSkid: 0 | 8;
}

export function parseCalculatorSearch(
  s: Record<string, unknown>,
): CalculatorSearch {
  return {
    v: 1,
    chainring: clampInt(s.chainring, 20, 80, 46),
    cog: clampInt(s.cog, 9, 30, 17),
    wheel: parseWheelSize(s.wheel),
    tire: clampInt(s.tire, 18, 50, 25),
    crank: snapCrankMm(s.crank),
    ambi: s.ambi === 1 || s.ambi === "1" ? 1 : 0,
  };
}

export function toConfig(search: CalculatorSearch): DrivetrainConfig {
  return {
    chainringTeeth: search.chainring,
    cogTeeth: search.cog,
    wheel: {
      beadSeatDiameterMm: WHEEL_SIZES[search.wheel].bsdMm,
      tireWidthMm: search.tire,
    },
    crankLengthMm: search.crank,
    ambidextrousSkidder: search.ambi === 1,
  };
}

export function formatCompareTuple(config: DrivetrainConfig): string {
  const wheel =
    (Object.keys(WHEEL_SIZES) as WheelSizeId[]).find(
      (id) => WHEEL_SIZES[id].bsdMm === config.wheel.beadSeatDiameterMm,
    ) ?? "700c";
  return [
    config.chainringTeeth,
    config.cogTeeth,
    wheel,
    config.wheel.tireWidthMm,
    config.crankLengthMm,
    config.ambidextrousSkidder ? 1 : 0,
  ].join(",");
}

export function parseCompareTuple(raw: unknown): DrivetrainConfig | undefined {
  if (typeof raw !== "string") return undefined;
  const parts = raw.split(",");
  if (parts.length !== 6) return undefined;
  const [ring, cog, wheel, tire, crank, ambi] = parts;
  return toConfig(
    parseCalculatorSearch({
      chainring: ring,
      cog,
      wheel,
      tire,
      crank,
      ambi,
    }),
  );
}

export function compactCompareExtras(s: CompareExtras): CompareExtras {
  const present = [s.c2, s.c3, s.c4].filter(
    (t): t is string => typeof t === "string" && t.length > 0,
  );
  const out: CompareExtras = {};
  if (present[0]) out.c2 = present[0];
  if (present[1]) out.c3 = present[1];
  if (present[2]) out.c4 = present[2];
  return out;
}

export function seedCompareExtras(
  bike: CalculatorSearch,
  extras: CompareExtras,
): CompareExtras {
  const compacted = compactCompareExtras(extras);
  if (compacted.c2) return compacted;
  const config = toConfig(bike);
  const plus = { ...config, cogTeeth: clampInt(bike.cog + 1, 9, 30, 18) };
  const minus = { ...config, cogTeeth: clampInt(bike.cog - 1, 9, 30, 16) };
  return {
    c2: formatCompareTuple(plus),
    c3: formatCompareTuple(minus),
  };
}

export function parseExploreSearch(s: Record<string, unknown>): ExploreSearch {
  const metric =
    s.metric === "dev" || s.metric === "skid" || s.metric === "gi"
      ? s.metric
      : "gi";
  const minSkid = s.minSkid === 8 || s.minSkid === "8" ? 8 : 0;
  return { metric, minSkid };
}
```

- [ ] **Step 4: Run search tests — expect pass**

Run: `npx vitest run src/lib/search.test.ts`

Expected: PASS (all cases above).

- [ ] **Step 5: Routing skeleton**

Add `src/styles.css`:

```css
@import "tailwindcss";
```

`src/Document.tsx`: set `<title>Fixie Gears</title>`, `<html lang="en">`, keep `HydrationScript`. Link `/src/styles.css` if the Solid start convention needs it (follow the plugin: if App import is enough, import styles from `App.tsx` or `__root.tsx` instead — one place only).

Create file routes using `@tanstack/solid-router` `createFileRoute`. Each route’s `validateSearch` must start from `parseCalculatorSearch`. Compare also runs `seedCompareExtras`. Explore also runs `parseExploreSearch`.

Placeholder page bodies are fine: an `<h1>` with the route name. `__root.tsx` must render a header with nav links to `/`, `/compare`, `/explore`, `/saved` that **spread current calculator search** so the bike is not wiped. Use `Link` from the router with `search` from the current route.

`src/router.tsx` / `src/App.tsx`: wire `RouterProvider` with the generated route tree from the Vite plugin (`routeTree.gen.ts`). Follow `@tanstack/solid-router` 2.0.0-rc file-based + `tanstackRouter({ target: "solid" })` conventions already in `vite.config.ts`. Do not install other packages.

`useCurrentSetup` in `src/lib/state/setup-store.ts`:

```ts
import { createMemo } from "solid-js";
import { deriveMetrics } from "~/lib/gear/calculations";
import { toConfig, type CalculatorSearch } from "~/lib/search";

export function useCurrentSetup(search: () => CalculatorSearch) {
  const config = createMemo(() => toConfig(search()));
  const metrics = createMemo(() => deriveMetrics(config()));
  return { config, metrics };
}
```

(If `Route.useSearch()` is the project pattern, `useCurrentSetup` may call it from the index route module instead — keep one function, no duplicated derive logic.)

- [ ] **Step 6: Verify**

Run: `npm run test`

Expected: gear tests + search tests pass.

Run: `npm run build`

Expected: emits `dist/client` without errors. If the router plugin requires a routes directory that you already created, it should generate `routeTree.gen.ts` (gitignore it if the plugin says to, otherwise commit it if the build needs it in repo — prefer generate-on-build).

- [ ] **Step 7: Commit**

```bash
git add src/lib/search.ts src/lib/search.test.ts src/lib/state src/routes src/router.tsx src/App.tsx src/Document.tsx src/styles.css
git commit -m "$(cat <<'EOF'
feat: add typed search and route skeleton

Keep the bike in the URL on every route so compare and explore cannot
drop the current setup.
EOF
)"
```

---

### Task 3: Prefs, UI primitives, calculator (F1)

**Files:**
- Create: `src/lib/format.ts`
- Create: `src/lib/state/prefs-store.ts`
- Create: `src/components/ui/ToothInput.tsx`
- Create: `src/components/ui/MetricCard.tsx`
- Create: `src/components/ui/Tooltip.tsx`
- Create: `src/components/ui/CadenceTable.tsx`
- Create: `src/components/ui/PresetChips.tsx`
- Create: `src/components/ui/UnitToggle.tsx`
- Create: `src/components/ui/ThemeToggle.tsx`
- Create: `src/components/calculator/CalculatorPage.tsx`
- Modify: `src/routes/__root.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/Document.tsx` (theme class before paint)
- Test: `src/components/ui/ToothInput.test.tsx`, `MetricCard.test.tsx`, `CadenceTable.test.tsx` as listed in `docs/06-testing.md`

**Interfaces:**
- Consumes: `useCurrentSetup`, `parseCalculatorSearch`, `PRESETS`, `ALLOWED_CRANKS_MM`, `WHEEL_SIZES`, `STANDARD_CADENCES`
- Produces: live calculator on `/` writing search via `navigate({ search, replace: true })`

- [ ] **Step 1: `format.ts`**

```ts
export function formatRatio(n: number): string {
  return n.toFixed(2);
}
export function formatGearInches(n: number): string {
  return `${n.toFixed(1)}″`;
}
export function formatDevelopment(n: number): string {
  return `${n.toFixed(2)} m`;
}
export function formatGain(n: number): string {
  return n.toFixed(2);
}
export function formatSpeed(n: number): string {
  return n.toFixed(1);
}
```

- [ ] **Step 2: prefs-store**

Solid 2.0 draft-first `createStore`. Shape: `{ units: "metric" | "imperial", theme: "light" | "dark" | "system" }`. Defaults metric + system. Persist `localStorage["fixie:prefs"]`. Hydrate on first access. Theme: apply `class="dark"` on `<html>` for dark (system uses `prefers-color-scheme`). Inject a tiny blocking inline script in `Document.tsx` so the first paint matches stored theme (no flash).

- [ ] **Step 3: Native UI wrappers + calculator**

Follow `docs/03-features.md` F1 and `docs/05-ui-design.md`. Inputs: `ToothInput` for chainring, cog, tire; `<select>` for wheel and crank (`ALLOWED_CRANKS_MM`); ambi `<input type="checkbox">` or button toggle. Every input `aria-label`. Five cards: ratio, hero length, secondary length, gain, skid (warn ≤ 2). Cadence table: 9 rows, highlight 90, **one** speed column from prefs. Presets write chainring+cog only; subtitle is gear inches on current wheel. Names from `PRESETS` (including `"Track 48/14"`).

Layout: inputs left / results right; mobile `<details>` for inputs. Accent `#FF5A1F`, dark `#111214`, light `#FAFAF8`. Tabular nums. No rollout card.

Header: UnitToggle, ThemeToggle, nav. Do not use forbidden Solid 1 APIs.

- [ ] **Step 4: Component tests per docs/06**

ToothInput: slider and stepper stay in sync, emit one navigation per change. MetricCard: formatted value, tooltip opens. CadenceTable: 9 rows, 90 highlighted. Warning for 48/16.

- [ ] **Step 5: `npm run test` then `npm run build` then commit**

```bash
git commit -m "$(cat <<'EOF'
feat: add calculator page bound to URL search

Riders change teeth and see metrics immediately without a submit
step or a second source of truth.
EOF
)"
```

---

### Task 4: Skid visualizer (F2)

**Files:**
- Create: `src/components/skid/SkidVisualizer.tsx`
- Create: `src/components/skid/SkidSuggestions.tsx`
- Modify: calculator page to include them
- Test: marker count; even-ring ambi one color

**Interfaces:**
- Consumes: `skidPatchAngles`, `skidPatchCount`, `suggestSkidImprovements`, current config
- Produces: SVG donut `role="img"`; Improve-this list; click writes ring+cog

- [ ] Implement F2 from `docs/03-features.md`. Two colors only when ambi AND odd chainring. Empty suggestions: keep panel. Even-ring ambi copy: “opposite foot hits the same patches.” `prefers-reduced-motion`. Click suggestion: `navigate` ring+cog only.

- [ ] Tests + `npm run test` + commit:

```bash
git commit -m "$(cat <<'EOF'
feat: add skid patch visualizer and suggestions

Show whether a ratio eats the tire, and nearby tooth changes that
keep the gear close.
EOF
)"
```

---

### Task 5: Compare (F3)

**Files:**
- Create: `src/components/compare/CompareTable.tsx`
- Create: `src/components/compare/CompareColumnHeader.tsx`
- Modify: `src/routes/compare.tsx`
- Modify: saved-store only if save-all is easier here — otherwise stub a callback Task 7 will wire. Prefer implementing save-all in Task 7; this task can expose a `onSaveAll` no-op or skip the button until Task 7. **Do include the Save all button in Task 7.** This task: table, extras, compact editors.

**Interfaces:**
- Consumes: `seedCompareExtras`, `formatCompareTuple`, `parseCompareTuple`, `compactCompareExtras`
- Produces: 2–4 column compare; col1 live global search

- [ ] Implement F3 from `docs/03`. Compact headers (no sliders). Deltas vs col1. Best highlight **only** skid (higher). Add column = copy of col1. Cannot remove col1. Compact slots.

- [ ] Tests: bare compare seeds cog±1; URL with only c2 stays 2 columns.

- [ ] `npm run test` + commit:

```bash
git commit -m "$(cat <<'EOF'
feat: add side-by-side setup compare

Let a rider park 16T vs 17T vs 18T on one shareable URL.
EOF
)"
```

---

### Task 6: Explore heatmap (F4)

**Files:**
- Create: `src/components/explore/HeatmapGrid.tsx`
- Modify: `src/routes/explore.tsx`

**Interfaces:**
- Consumes: `parseExploreSearch`, `GOOD_SKID_PATCHES`, current setup, `deriveMetrics`
- Produces: 38–60 × 11–23 grid; click → `/` with new ring/cog

- [ ] Implement F4 from `docs/03`. Color: diverging centered on current setup for gi/dev; sequential for skid. `minSkid=8` dims. Cells are `<button>`s with aria-labels.

- [ ] `npm run test` + commit:

```bash
git commit -m "$(cat <<'EOF'
feat: add chainring by cog explorer heatmap

Scan nearby ratios without leaving the current wheel and crank.
EOF
)"
```

---

### Task 7: Saved setups (F5) + copy link (F7)

**Files:**
- Create: `src/lib/state/saved-store.ts`
- Modify: `src/routes/saved.tsx`
- Create: `src/components/ui/CopyLinkButton.tsx`
- Modify: `__root.tsx` header
- Wire Compare “Save all”

**Interfaces:**
- Produces: `{ id, name, savedAt, config }[]`; `load` navigates to `/`; export `{ v: 1, setups }`; unknown v refuses; merge import

- [ ] Implement F5 and F7 from `docs/03`. `crypto.randomUUID()` for ids. No drag-reorder. CopyLinkButton copies `location.href`.

- [ ] Tests: save → reload list; import `{ v: 2, setups: [] }` rejected.

- [ ] `npm run test` + commit:

```bash
git commit -m "$(cat <<'EOF'
feat: add saved setups and copy-link sharing

Keep named bikes on this device and share the current URL as the
canonical setup.
EOF
)"
```

---

### Task 8: Milestone verification

**Files:** none new unless a checklist item is missing.

- [ ] `npm run test` passes
- [ ] `npm run build` emits `dist/client`
- [ ] `grep -r "createResource\|classList\|produce" src/` is empty (except comments if any — there should be none)
- [ ] `netlify.toml` still has SPA fallback `/*` → `/index.html` 200
- [ ] No “offline” / “offline-first” in UI copy
- [ ] Prettier print width 80 on `src/`

Fix any gaps. Commit only if there are changes:

```bash
git commit -m "$(cat <<'EOF'
chore: close v1 verification gaps

EOF
)"
```
