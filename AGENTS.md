# Agent Instructions

You are implementing **Fixie Gears**, a fixed-gear ratio calculator. Read all
files in `docs/` before writing code. Implement in this order:

1. `src/lib/gear/` — copy the seed code from `docs/08-seed-code.md`
   verbatim, run the tests, get them green before any UI.
2. Routing skeleton (`__root`, `index`, `compare`, `explore`, `saved`) with
   the **shared** calculator search parser on every route (see `docs/04`).
3. Calculator page (F1) end-to-end: inputs → URL → memos → metric cards.
4. Skid visualizer (F2), then compare (F3), explore (F4), saved (F5),
   prefs (F6).

## Hard rules

- **Solid 2.0 APIs only.** Forbidden: `createResource`, `batch`,
  `startTransition`, `useTransition`, `on`, `createComputed`, `produce`,
  `createMutable`, `onMount`, `classList`, `use:` directives, `<Index>`.
  See `docs/04-state-and-routing.md` for replacements.
- `<For>` children receive accessors: `{(item) => <li>{item().name}</li>}`.
- **No third-party component or form libraries** (ADR-001, ADR-002 in
  `docs/07`). Native elements + Tailwind wrappers in `src/components/ui/`.
- All domain math lives in `src/lib/gear/` as pure functions with no
  framework imports. UI never contains formulas.
- Never store derived values in signals/stores — always `createMemo`.
- Config changes go through `navigate({ search, replace: true })`; never
  mutate search state locally.
- Calculator search params are global; navigating between routes must
  spread them. Do not claim offline-first in UI copy.
- Format and lint with Biome (`npm run format` / `npm run check`). Print
  width 80, 2-space indent. Lefthook runs Biome on commit and Biome plus
  typecheck on push.
- Run `npm run test` after each milestone; do not proceed with failing
  tests.

## Verification checklist per milestone

- [ ] `npm run dev` starts without errors
- [ ] `npm run test` passes
- [ ] `npm run check` is clean
- [ ] `npm run typecheck` is clean
- [ ] `npm run build` emits `dist/client`
- [ ] No Solid 1.x APIs anywhere
      (`grep -r "createResource\|classList\|produce" src/`)
- [ ] `netlify.toml` present at repo root with SPA fallback redirect

## Dependency pinning (ADR-004)

- `@tanstack/solid-router` and `@tanstack/solid-router-devtools` are pinned
  to the `2.0.0-rc.x` line (Solid 2.0-compatible). The `latest` dist-tag
  (1.x) peers on solid-js ^1.x and MUST NOT be installed.
- `@tanstack/router-plugin` stays on latest 1.x.
- `solid-js` / `@solidjs/web` versions are enforced via package.json
  `overrides`. Do not remove them.
- Never run `npm update` on TanStack packages without checking peer ranges
  against the installed solid-js version first.
