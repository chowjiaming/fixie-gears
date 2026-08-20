# Contributing

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

Branch off `main`. Package manager is [pnpm](https://pnpm.io/installation)
11 — never commit a `package-lock.json`. `pnpm install` runs Lefthook via
`prepare`; do not skip git hooks.

```bash
pnpm install
pnpm test && pnpm typecheck && pnpm check && pnpm build
```

## Commits and PRs

Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`,
`refactor:`.

## Project rules

- UI wrappers are native HTML + Tailwind in `src/components/ui/`
  (ADR-001). No third-party component or form libraries.
- Domain math lives in `src/lib/gear/` as pure functions with no
  framework imports. The UI never contains formulas.
- Do not bump TanStack or `solid-js` without checking peer ranges
  (ADR-004).
- Agents: read [`AGENTS.md`](AGENTS.md) and [`docs/`](docs/00-project-overview.md)
  first.
