# Decisions & Deployment

## UI library decision (ADR-001)

No third-party component library in v1. Kobalte, Ark UI, solid-ui, and
solidcn have not shipped Solid 2.0-compatible releases as of August 2026
(Kobalte stable peers on solid-js ^1.x; Ark UI deferred to post-RC).

- Use native HTML elements (`input[type=range]`, `select`, `button`,
  `details`, `dialog`) styled with Tailwind 4.
- Wrap each in `src/components/ui/` so a future Kobalte 2.0 migration
  touches only wrapper internals.
- Add ARIA attributes manually: `aria-label` on all inputs, `role="img"`
  + `aria-label` on the skid visualizer SVG, `aria-live="polite"` on
  metric value regions.

## Form library decision (ADR-002)

No form library. Calculator inputs write directly to URL search params
via `navigate({ search, replace: true })`; validation is clamping / snapping
inside `validateSearch`. Do not introduce `@tanstack/solid-form` or
`@modular-forms/solid` — they create a second source of truth that
competes with the URL.

## Deployment (ADR-003)

Netlify, static site.

- Build command: `npm run build`
- Publish directory: `dist/client`
- SPA fallback via `netlify.toml` redirects (see repo root)
- Production deploys from `main`; PRs get deploy previews
- Do NOT configure a router basepath; the site serves from `/`
- Chosen over GitHub Pages because: clean SPA fallback for deep links
  (no 404 hack or hash history), no repo-name basepath, deploy previews,
  and a functions upgrade path if v2 adds accounts/sync.

v1 is local computation, not a PWA. Do not describe the site as
offline-first in the UI or README until an installable manifest exists.

## TanStack version pins (ADR-004)

`@tanstack/solid-router` and `@tanstack/solid-router-devtools` are pinned
to the **`2.0.0-rc.x`** line (Solid 2.0-compatible). The `latest`
dist-tag (1.x) peers on solid-js ^1.x and MUST NOT be installed.

- `@tanstack/router-plugin` stays on latest 1.x.
- `solid-js` / `@solidjs/web` versions are enforced via package.json
  `overrides`. Do not remove them.
- Never run `npm update` on TanStack packages without checking peer ranges
  against the installed solid-js version first.

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

v1 sizes: **700c (622), 650b (584), 26in (559)**. Tire width **18–50 mm**.

650c (571) is a rare triathlon / old-track size; street/gravel/commuter
bikes that aren’t 700c are 650b. 650c can return in v1.1 if someone asks.
Unknown `wheel` values, including `650c`, parse as `700c`.

Diameter stays `BSD + 2 × tireWidth` so seeded chart numbers remain
comparable to other web calculators. The tooltip discloses the
approximation. Measured circumference is v2.

## Global search and compare encoding (ADR-007)

The calculator keys live on **every** route. Compare extras are optional
compact tuples `c2`/`c3`/`c4`. Missing **all** extras seeds neighbor cogs
(the shop question: 17 vs 16 vs 18). A link with only `c2` is a two-bike
compare and must not bounce back to three. One-column compare is not a
product.

Column 1 is a live alias of the global search, not a snapshot.
