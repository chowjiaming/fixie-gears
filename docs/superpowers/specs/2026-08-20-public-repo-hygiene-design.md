# Public-repo hygiene — Design

Turn Fixie Gears into a GitHub-ready public resource. No product
features. No domain-math changes. No new npm packages.

**Job:** a visitor landing on github.com/chowjiaming/fixie-gears can
tell what the app is, run it, license it, report a bug, and see CI
on a PR. GitHub's community-standards checklist goes green.

**Live site:** `https://fixie-gears.netlify.app/`
**Copyright:** `Copyright (c) 2026 chowjiaming`
**License:** MIT (already declared in `package.json`; the missing
`LICENSE` file is why GitHub currently shows Unlicensed).

---

## Out of scope

- OpenSSF Scorecard, SHA-pinned Actions, CODEOWNERS, changelog bots,
  Docker, semantic-release, FUNDING.yml
- Favicon / og-image / README screenshot (no binary assets in the repo
  today; a screenshot is a follow-up)
- Rewriting `docs/00`–`docs/08` or the historical superpowers plans
- Enabling GitHub Pages (Netlify is the host)
- Changing search params, Solid APIs, or TanStack pins

---

## 1. Product README

Replace `README.md` entirely. It is currently the Solid `bare` template
and tells visitors to grow into the `fullstack` template. The
engineering spec stays in `docs/`; the README does not duplicate it.

Exact contents (outer fence is tildes so the inner bash fence stays intact):

~~~~markdown
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
~~~~

The implementer writes that as `README.md` with normal fences.

---

## 2. package.json

Add, without changing dependency versions:

```json
"private": true,
"description": "Street-fixie ratio calculator: gear inches, development, skid patches, chain links.",
"engines": {
  "node": ">=22.13.0",
  "pnpm": ">=11"
}
```

`private: true` prevents an accidental `pnpm publish`. `engines` matches
pnpm 11's Node floor. Keep `packageManager: "pnpm@11.17.0"`.

---

## 3. LICENSE

Create `LICENSE` with the MIT text, copyright line exactly:

```text
Copyright (c) 2026 chowjiaming
```

---

## 4. Code of conduct

Create `CODE_OF_CONDUCT.md` using Contributor Covenant v2.1 verbatim
(https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

Enforcement contact (the only placeholder in that template):

```text
https://github.com/chowjiaming/fixie-gears/issues
```

Do not invent an email address. The GitHub issue tracker is the
enforcement inbox for a single-maintainer public app.

---

## 5. CONTRIBUTING.md

Create `CONTRIBUTING.md`:

- Branch off `main`. Conventional commits (`feat:`, `fix:`, `docs:`,
  `chore:`, `test:`, `refactor:`).
- Package manager is pnpm. Never commit `package-lock.json`.
- Before a PR: `pnpm test && pnpm typecheck && pnpm check && pnpm build`.
- Lefthook is installed by `pnpm install` (`prepare`). Do not skip hooks.
- UI wrappers stay native HTML + Tailwind in `src/components/ui/`
  (ADR-001). Domain math stays in `src/lib/gear/` with no framework
  imports.
- Do not bump TanStack or `solid-js` without checking peers (ADR-004).
- Agents: read `AGENTS.md` and `docs/` first.
- By participating you agree to the Code of Conduct.

---

## 6. SECURITY.md

Create `.github/SECURITY.md` (GitHub's preferred path so the Security
tab picks it up):

```markdown
# Security

Fixie Gears is a static site. There is no server, no accounts, and no
database. Saved setups live in the visitor's `localStorage`.

## Reporting a vulnerability

Please use GitHub's **privately report a vulnerability** form on this
repository rather than a public issue:

https://github.com/chowjiaming/fixie-gears/security/advisories/new

That covers XSS in this origin, open redirects, and anything that could
exfiltrate another visitor's saved setups if they opened a crafted URL.

## What this project does not handle

Supply-chain issues in GitHub Actions or npm packages: open a private
advisory too. Dependency bumps go through Dependabot PRs.
```

Enable private vulnerability reporting (repo setting, not a file):

```bash
gh api -X PUT repos/chowjiaming/fixie-gears/private-vulnerability-reporting
```

---

## 7. Issue and PR templates

`.github/ISSUE_TEMPLATE/config.yml`:

```yaml
blank_issues_enabled: true
contact_links:
  - name: Live calculator
    url: https://fixie-gears.netlify.app/
    about: The running app, not the issue tracker
```

`.github/ISSUE_TEMPLATE/bug.yml`:

```yaml
name: Bug
description: Something in the calculator is wrong
labels: [bug]
body:
  - type: textarea
    id: happened
    attributes:
      label: What happened
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: What you expected
    validations:
      required: true
  - type: input
    id: url
    attributes:
      label: URL
      description: Include the search string if the setup matters
      placeholder: https://fixie-gears.netlify.app/?chainring=46&cog=17
    validations:
      required: true
  - type: input
    id: browser
    attributes:
      label: Browser
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
    validations:
      required: false
```

`.github/ISSUE_TEMPLATE/feature.yml`:

```yaml
name: Feature
description: A job the calculator does not cover yet
labels: [enhancement]
body:
  - type: textarea
    id: job
    attributes:
      label: The job to be done
    validations:
      required: true
  - type: textarea
    id: gap
    attributes:
      label: Why the current app does not cover it
    validations:
      required: false
  - type: markdown
    attributes:
      value: >
        Geared/derailleur drivetrains and a backend are non-goals.
        See docs/00-project-overview.md.
```

`.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Summary

-

## Test plan

- [ ] `pnpm test && pnpm typecheck && pnpm check && pnpm build`
- [ ]
```

---

## 8. CI

Create `.github/workflows/ci.yml`. Follow current pnpm CI docs: one
`pnpm/setup` step installs pnpm (from `packageManager`) and Node, then
runs `pnpm install`. Version tags, not SHAs — Dependabot bumps them.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/setup@v2
        with:
          runtime: node@24
          cache: true
          install: true
      - run: pnpm check
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

`pnpm/setup@v2` with `install: true` (the default) already runs
`pnpm install`. Do not add a second install step. `runtime: node@24`
matches `.nvmrc`. Frozen lockfile is pnpm's default in CI.

---

## 9. Dependabot

`.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

The npm ecosystem covers `pnpm-lock.yaml`. Do not add a separate pnpm
ecosystem key — GitHub does not have one.

---

## 10. Tooling pins

Create `.nvmrc` containing exactly:

```text
24
```

Create `.gitattributes`:

```text
* text=auto eol=lf
```

`.editorconfig` already exists and already asks for lf / 2-space / 80
columns. Do not duplicate it.

---

## 11. GitHub repo settings

Not files. Run after the files land, on the feature branch or after
merge — they apply to the repository, not a ref.

```bash
gh repo edit chowjiaming/fixie-gears \
  --description "Street-fixie ratio calculator: gear inches, development, skid patches, chain links." \
  --homepage "https://fixie-gears.netlify.app/" \
  --add-topic fixed-gear \
  --add-topic cycling \
  --add-topic calculator \
  --add-topic solidjs \
  --add-topic typescript \
  --enable-issues \
  --disable-wiki \
  --disable-projects

gh api -X PUT repos/chowjiaming/fixie-gears/private-vulnerability-reporting
```

`--disable-wiki` / `--disable-projects` remove empty public spam
surfaces. Issues stay on.

---

## 12. Docs touch-up

Add **ADR-011 Public repository** to `docs/07-decisions-and-deployment.md`:

- MIT, copyright chowjiaming, `LICENSE` at repo root so GitHub detects it
- App is `private: true` (not an npm package)
- Visitor docs in README; engineering docs in `docs/`
- CI on GitHub Actions; deploy remains Netlify
- No Corepack (ADR-010)

Add one line to `AGENTS.md` Hard rules: PRs must stay green on GitHub
Actions CI (`pnpm check`, `typecheck`, `test`, `build`).

---

## File map

**Create**

- `LICENSE`
- `CODE_OF_CONDUCT.md`
- `CONTRIBUTING.md`
- `.github/SECURITY.md`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/ISSUE_TEMPLATE/bug.yml`
- `.github/ISSUE_TEMPLATE/feature.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/workflows/ci.yml`
- `.github/dependabot.yml`
- `.nvmrc`
- `.gitattributes`

**Replace**

- `README.md`

**Modify**

- `package.json` (`private`, `description`, `engines`)
- `docs/07-decisions-and-deployment.md` (ADR-011)
- `AGENTS.md` (CI line)

**GitHub API (not a file)**

- `gh repo edit` description, homepage, topics, wiki off, projects off
- private vulnerability reporting on

---

## Constraints

- Solid 2.0 only. Same forbidden APIs as `AGENTS.md`.
- No new npm dependencies. Do not bump TanStack or `solid-js`.
- pnpm only. No `package-lock.json`.
- Search `v` stays `1`. No domain or URL changes.
- Format with Biome. Do not put `LICENSE` or YAML workflows through a
  formatter that would mangle them — Biome already ignores most of
  `.github` unless included; do not add a biome pass over `LICENSE`.
- Historical superpowers plans still say `npm`; leave them.

## Verification

- GitHub community standards: Description, README, Code of conduct,
  Contributing, License, Security policy, Issue templates, Pull request
  template — all present.
- `gh repo view --json licenseInfo,description,homepageUrl,repositoryTopics`
  shows MIT, the description, the Netlify homepage, and the five topics.
- Wiki and Projects are off; Issues are on.
- A PR against the branch runs CI: check, typecheck, test, build.
- `pnpm test` still 152; `pnpm check` and `pnpm typecheck` clean.
- `package.json` has `"private": true`.
- README does not mention the Solid `bare` template, SSR flip, or
  "offline-first".
