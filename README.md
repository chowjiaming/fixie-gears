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
SPA on Netlify (`netlify.toml`). Design and domain docs live in
[`docs/`](docs/00-project-overview.md). Agent instructions:
[`AGENTS.md`](AGENTS.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
