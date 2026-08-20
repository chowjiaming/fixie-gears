# Fixie Gears

A street-fixie ratio calculator. Pick a chainring, cog, wheel, and
crank; get gear inches, development, gain ratio, speed at cadence, skid
patches, and chain-link counts. The URL is the source of truth, so
every setup is shareable.

**[Open the calculator](https://fixie-gears.netlify.app/)**

## What it does

- Calculator with live metric cards, cadence table, and skid visualizer
- Optional taped tire circumference and chainstay → even/odd chain links
- Compare up to four setups; explore nearby ratios on a heatmap
- Saved bikes stay in this browser (`localStorage`); no account
- Metric / imperial and light / dark

All math runs in the browser. There is no backend.

## Develop

Requires [pnpm](https://pnpm.io/installation) 11 (standalone script,
Homebrew, winget, or Scoop — not Corepack) and Node.js 22.13+.

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test
pnpm check        # Biome
pnpm typecheck
pnpm build        # emits dist/client
```

Lefthook runs Biome on commit and Biome plus typecheck on push.

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
