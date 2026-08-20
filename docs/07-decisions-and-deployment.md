# Decisions & Deployment

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
  cards are silent (see `docs/05-ui-design.md`).

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

