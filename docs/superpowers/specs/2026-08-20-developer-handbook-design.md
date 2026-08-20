# Developer handbook — Design

Turn `docs/` from a greenfield build spec into a living handbook for
people and agents who arrive at a finished app. Forward-only: delete
and replace in new commits. Do not rewrite git history.

**Job:** a contributor (human or agent) can find layout, domain math,
URL state, and ADRs without reading a v1 implementation sequence or
dated SDD plans. GitHub visitors still get a product README; that
README also carries a short paragraph per handbook page with a link
to the full version.

**Branch:** `docs/developer-handbook` (off `main` after PR #5).
**Live site:** `https://fixie-gears.netlify.app/`

---

## Out of scope

- Rewriting git history (`git filter-repo`, BFG, force-push to `main`)
- OpenSSF Scorecard, SHA-pinned Actions, CODEOWNERS, FUNDING, screenshots,
  favicon, og-image
- A `docs/README.md` index (the repo README is the index)
- Resurrecting F1–F7 checklists or `docs/08-seed-code.md`
- Any `src/` or test changes. `pnpm test` stays 152.
- New npm dependencies. No TanStack or `solid-js` bumps.

---

## Ownership

| Reader | Always-on | On demand |
| --- | --- | --- |
| GitHub visitor | Product README | Handbook links |
| Human contributor | README + `CONTRIBUTING.md` | The four `docs/*.md` pages |
| Agent | `AGENTS.md` hard rules | One handbook page per pointer |

Facts have one home. README summarizes; `docs/` is the full version.
Formulas and search-param tables do not appear in the README.

---

## File map

**Create:**

- `docs/architecture.md`
- `docs/domain.md`
- `docs/state-and-routing.md`
- `docs/decisions.md`

**Replace contents:**

- `README.md`
- `AGENTS.md`
- `CONTRIBUTING.md` (agents pointer only; keep setup / commits / the
  three human project-rule bullets)
- `.github/ISSUE_TEMPLATE/feature.yml` (drop `docs/00-project-overview.md`)

**Delete:**

- `docs/00-project-overview.md`
- `docs/01-architecture.md`
- `docs/02-domain-model.md`
- `docs/03-features.md`
- `docs/04-state-and-routing.md`
- `docs/05-ui-design.md`
- `docs/06-testing.md`
- `docs/07-decisions-and-deployment.md`
- `docs/08-seed-code.md`
- `docs/superpowers/` (every spec and plan, **including this spec and
  its implementation plan**, in the last implementation task)

After that last delete, `docs/` contains exactly four markdown files.
`.superpowers/` (gitignored SDD scratch) is not `docs/superpowers/` —
leave it alone.

**Code vs old numbered docs:** when they disagree, `src/` wins.
`docs/02` and `docs/04` are drafts. Types, ranges, and formulas in the
new pages must match `src/lib/gear/*` and `src/lib/search.ts`.

---

## README

Keep the current product block (title through Develop, including the
command fence). Change Stack and everything after it to the text
below. Outer fence is tildes so inner fences stay intact.

~~~~markdown
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

No formulas. No F1–F7. No Solid `bare` template, SSR flip, or
"offline-first".

---

## `docs/architecture.md`

How the app is put together. No build-order.

Required headings:

1. **Stack** — table: Solid 2.0 RC, `@solidjs/vite-plugin`, Vite start
   mode client-only, TanStack Solid Router, Tailwind 4, native HTML +
   Tailwind wrappers, Vitest + `@solidjs/testing-library`, Netlify
   static. Link ADRs in `docs/decisions.md`, not `docs/07`.
2. **Rendering** — no SSR. `solid({ start: true })` without `ssr: true`.
   Build emits `dist/client`. SPA fallback in `netlify.toml`. No router
   basepath.
3. **Directory layout** — tree that matches the repo today (not the
   outdated `docs/01` tree). Include `Document.tsx`, `App.tsx`,
   `chain.ts`, `design-contracts.test.ts`, `components/saved/`,
   `routeTree.gen.ts` (generated; do not edit). Do not list every
   `*.test.tsx`; say tests sit next to the source they cover.
4. **State (short)** — three tiers: URL search (bike, every route) >
   Solid stores (prefs, saved) > localStorage. Derived metrics are
   `createMemo`. Units and theme are not in the URL. Details live in
   `docs/state-and-routing.md`.
5. **UI conventions** — native wrappers in `src/components/ui/`
   (`Button`, `SegmentedControl`, `ToothInput`, …). `--color-accent`
   for fills/borders/graphics; `--color-accent-ink` for accent text and
   outlines on paper (`text-accent-ink dark:text-accent`). Text on an
   accent fill is `text-ink`. One `sr-only` `aria-live="polite"` region
   on `/`; metric cards are silent. Skip link to `#main`. Heatmap: no
   `role="grid"` / `row` / `gridcell` (ADR-009). Do not paste ASCII
   wireframes from `docs/05`.
6. **Testing and CI** — `pnpm test`, `pnpm typecheck`, `pnpm check`,
   `pnpm build`. CI is `.github/workflows/ci.yml`. Lefthook: Biome on
   commit, Biome + typecheck on push.

---

## `docs/domain.md`

The math, as implemented. Source of truth is `src/lib/gear/`. No
"copy seed from `docs/08`".

Required headings:

1. **Isolation** — pure, total, unit-tested; no framework imports in
   `src/lib/gear/`. UI never contains formulas.
2. **Types** — quote `WheelSpec`, `DrivetrainConfig`, `DerivedMetrics`,
   `SpeedRow` from `src/lib/gear/types.ts`. Call out:
   `rolloutMeters` is an alias of development, not a sixth card;
   `circumferenceMm` is optional; **stay is not on `DrivetrainConfig`**.
3. **Wheel diameter** — unset: `D_mm = BSD + 2 × tireWidth`;
   taped `circ` in `[1800, 2500]`: `C_m = circ / 1000`,
   `D_mm = circ / π`. Invalid circ falls back to BSD. Skid ignores circ.
4. **Gear metrics** — ratio, gear inches, development, gain ratio,
   speed at cadence. Cadence rows and the single speed column are UI;
   mention them so the table is not a mystery, but do not restate
   component props.
5. **Chain** — `chainLength(stayMm, ring, cog)` from `chain.ts`. Stay
   350–450 mm, default 410, URL-only. Even/odd links, `halfLinkCloser`
   strict inequality, tie → lower. Seed example 46/17 @ 410 → even 98,
   odd 97, warning on — only if `src/lib/gear/chain.test.ts` still
   asserts that.
6. **Skid** — `base = cog / gcd(ring, cog)`; ambi doubles **only** when
   the ring is odd (ADR-005). Warning at `≤ 2` patches. Suggestions:
   ±2 teeth, keep more patches, ≥8 then closest ratio (see `skid.ts`).
   Visualizer: two colors only for two foot-sets (ambi **and** odd
   ring). Even-ring ambi copy: "opposite foot hits the same patches."
7. **Ranges** — match `parseCalculatorSearch` / `clampInt` / `snapCrankMm`
   / `parseWheelSize`. `crank` is a float; do not `clampInt` it.
8. **Presets** — `PRESETS` from the gear module; applying a preset
   writes chainring and cog only.

Worked numbers must match existing tests (48/16 → 1 patch; 46/17 700×25
gain/speed figures in `calculations.test.ts`). Do not invent a second
test plan.

---

## `docs/state-and-routing.md`

How the bike moves through the URL and stores.

Required headings:

1. **Shared calculator search** — every route's `validateSearch` calls
   `parseCalculatorSearch` in `src/lib/search.ts`. Quote
   `CalculatorSearch` from that file. `v` stays `1`. Defaults apply in
   validation so `/` is a complete bike. Missing stay → 410 without
   requiring `?stay=410`. Missing/garbage/out-of-range `circ` → property
   **absent**. Clearing circ deletes the key.
2. **Read and write** — `useSearch()` to read;
   `navigate({ search, replace: true })` to write. Never mutate search
   locally. Navigating between routes **spreads** calculator keys
   (including `stay` and `circ` when present).
3. **Compare extras** — `c2`/`c3`/`c4` compact tuples: 6 parts = no
   circ, 7 = trailing circ, any other length discarded. Compact holes.
   No extras after parse → seed neighbor cogs. A URL with only `c2` is
   two-column and must not re-seed `c3`. Column 1 is a live alias of
   global search. Stay is global, not in tuples.
4. **Explore extras** — `metric`: `"gi" | "dev" | "skid"` (default
   `gi`); `minSkid`: `0 | 8` (default `0`).
5. **Stores** — prefs (`fixie:prefs`, units default metric, theme
   system); saved (`fixie:saved`, `DrivetrainConfig` with optional circ,
   no stay). Export `{ v: 1, setups }`; unknown `v` rejects. Draft-first
   Solid 2.0 stores; no `produce`.
6. **Solid 2.0 replacements** — move the forbidden-API list and
   replacements here from today's `docs/04` (no `createResource`,
   `batch`, `on`, `createComputed`, `produce`, `createMutable`,
   `onMount`, `classList` prop, `use:` directives, `<Index>`). `<For>`
   children are accessors. Derived state is `createMemo`. `AGENTS.md`
   keeps a short hard-rule list and points here for replacements.

---

## `docs/decisions.md`

Move ADR-001 through ADR-011 from `docs/07-decisions-and-deployment.md`.
Copy bodies; do not rewrite from memory.

Link fixes:

- `docs/05-ui-design.md` → `docs/architecture.md` (UI conventions)
- `docs/07` / `docs/07-decisions-and-deployment.md` → this file
- any `docs/00`–`docs/08` path → the new page that owns that fact

**ADR-011** — replace the visitor/engineering bullets with:

```markdown
- Visitor-facing product copy lives in `README.md`. `README.md` also
  carries a short paragraph per handbook page with a link to the full
  version. Engineering docs live in `docs/`. Formulas and search-param
  tables live only in `docs/domain.md` and
  `docs/state-and-routing.md`.
```

Keep MIT, `private: true`, CI vs Netlify, pnpm/Corepack (ADR-010) as
they are.

---

## `AGENTS.md`

Replace entirely. No "read all of `docs/`", no seed copy, no F1–F7
sequence, no empty-repo milestone checklist.

Exact contents:

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

---

## Other pointers

**`CONTRIBUTING.md`** — replace the last project-rule bullet with:

```markdown
- Agents: [`AGENTS.md`](AGENTS.md). Handbook map: [README.md](README.md).
```

Keep the three human bullets (UI wrappers, domain math, pin policy).

**`.github/ISSUE_TEMPLATE/feature.yml`** — replace the `docs/00` sentence
with:

```text
Geared/derailleur drivetrains and a backend are non-goals.
See the README for what the app does.
```

**Sweep:** after the deletes, `git grep -E 'docs/0[0-8]|docs/superpowers|seed-code'`
on tracked files must be empty.

---

## Git

- New commits on `docs/developer-handbook`. Conventional `docs:`
  messages.
- Do not amend merged history. Do not force-push `main`.
- The last implementation commit may delete `docs/superpowers/`, which
  removes this spec and the plan from `HEAD`. That is intended; they
  remain in git history.

---

## Definition of done

- [ ] `docs/` contains exactly `architecture.md`, `domain.md`,
      `state-and-routing.md`, `decisions.md`
- [ ] README product copy intact; four summary sections with full-version
      links; no formulas
- [ ] `AGENTS.md` has no seed / F1–F7 / "read all of docs/"
- [ ] `git grep` for `docs/00`, `docs/08`, `docs/superpowers` is empty
      on tracked files
- [ ] ADR-001 through ADR-011 present in `docs/decisions.md`; ADR-011
      matches the README split
- [ ] `pnpm test` 152, `pnpm typecheck` and `pnpm check` clean
