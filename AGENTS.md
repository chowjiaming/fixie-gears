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
  spread them. The app shell works offline after the first successful
  visit; do not describe the product as offline-first, and do not claim
  it works without ever having had a network.
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
