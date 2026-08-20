# Public-repo hygiene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make github.com/chowjiaming/fixie-gears a GitHub-ready public
resource: product README, MIT license, community health files, CI, and
repo metadata.

**Architecture:** Files only, plus two `gh` API calls. No application
code. Visitor docs in README; engineering docs stay in `docs/`.

**Tech Stack:** pnpm 11, GitHub Actions (`pnpm/setup@v2`), Dependabot,
Contributor Covenant 2.1, MIT.

**Spec:** `docs/superpowers/specs/2026-08-20-public-repo-hygiene-design.md`

**Branch:** `chore/public-oss` (already created; spec commit is
`009a18d`).

## Global Constraints

- No new npm dependencies. Do not bump TanStack or `solid-js`.
- pnpm only. Never commit `package-lock.json`.
- Search `v` stays `1`. No domain, URL, or UI code changes.
- Live site: `https://fixie-gears.netlify.app/`
- Copyright line exactly: `Copyright (c) 2026 chowjiaming`
- CoC enforcement contact exactly:
  `https://github.com/chowjiaming/fixie-gears/issues`
- Do not invent an email address.
- Actions stay on version tags (not SHAs). `pnpm/setup@v2` already runs
  `pnpm install` when `install: true`; do not add a second install step.
- Do not rewrite `docs/00`–`docs/08` except ADR-011 in `docs/07`.
- Leave historical superpowers plans that still say `npm`.
- README must not mention the Solid `bare` template, an SSR flip, or
  "offline-first".
- Format with Biome on `package.json` / `AGENTS.md` / `docs/07`. Do not
  run Biome on `LICENSE` or try to "format" YAML into JSON.
- `pnpm test` count may only stay 152 or go up.

---

## File map

- Replace: `README.md`
- Create: `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`
- Create: `.github/SECURITY.md`
- Create: `.github/ISSUE_TEMPLATE/config.yml`, `bug.yml`, `feature.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/workflows/ci.yml`, `.github/dependabot.yml`
- Create: `.nvmrc`, `.gitattributes`
- Modify: `package.json`, `docs/07-decisions-and-deployment.md`,
  `AGENTS.md`

---

### Task 1: Community health files

**Files:**
- Replace: `README.md`
- Create: `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`
- Create: `.github/SECURITY.md`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/ISSUE_TEMPLATE/feature.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

**Interfaces:**
- Consumes: nothing
- Produces: the GitHub community-standards files except CI

- [ ] **Step 1: Write README.md**

Overwrite `README.md` with exactly:

```markdown
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
```

(Use a normal ` ```bash ` fence in the real file, not tildes.)

- [ ] **Step 2: Write LICENSE**

```text
MIT License

Copyright (c) 2026 chowjiaming

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: Write CODE_OF_CONDUCT.md**

Contributor Covenant v2.1 verbatim from
https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md
with the single substitution: replace `[INSERT CONTACT METHOD]` with
`https://github.com/chowjiaming/fixie-gears/issues`. Keep the
Attribution / FAQ / translations footer links.

- [ ] **Step 4: Write CONTRIBUTING.md**

```markdown
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
```

- [ ] **Step 5: Write `.github/SECURITY.md`**

Exact body from spec §6.

- [ ] **Step 6: Write issue and PR templates**

Exact YAML/Markdown from spec §7 (`config.yml`, `bug.yml`, `feature.yml`,
`PULL_REQUEST_TEMPLATE.md`).

- [ ] **Step 7: Sanity-check the visitor files**

Run:

```bash
rg -n "bare template|fullstack template|offline-first|ssr: true" README.md
test -f LICENSE && test -f CODE_OF_CONDUCT.md && test -f CONTRIBUTING.md
test -f .github/SECURITY.md
test -f .github/ISSUE_TEMPLATE/bug.yml
```

Expected: `rg` prints nothing. Every `test -f` succeeds.

- [ ] **Step 8: Commit**

```bash
git add README.md LICENSE CODE_OF_CONDUCT.md CONTRIBUTING.md \
  .github/SECURITY.md .github/ISSUE_TEMPLATE .github/PULL_REQUEST_TEMPLATE.md
git commit -m "$(cat <<'EOF'
docs: add public-repo community health files

EOF
)"
```

---

### Task 2: CI, engines, and pins

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/dependabot.yml`
- Create: `.nvmrc`
- Create: `.gitattributes`
- Modify: `package.json`

**Interfaces:**
- Consumes: `packageManager: "pnpm@11.17.0"`
- Produces: CI workflow that `pnpm/setup@v2` can run from `packageManager`

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

Exact YAML from spec §8.

- [ ] **Step 2: Write `.github/dependabot.yml`**

Exact YAML from spec §9.

- [ ] **Step 3: Write `.nvmrc`** (exactly `24` plus a newline) **and
`.gitattributes`** (`* text=auto eol=lf`).

- [ ] **Step 4: Patch package.json**

Insert after `"description": ""` / next to existing fields. Do not
change dependency versions. Resulting top of the file:

```json
{
  "name": "fixie-gears",
  "private": true,
  "version": "0.0.0",
  "description": "Street-fixie ratio calculator: gear inches, development, skid patches, chain links.",
  "type": "module",
```

And after `"packageManager": "pnpm@11.17.0"`:

```json
  "engines": {
    "node": ">=22.13.0",
    "pnpm": ">=11"
  },
```

Keep `"license": "MIT"`. Keep `overrides`.

- [ ] **Step 5: Verify locally**

```bash
pnpm test && pnpm typecheck && pnpm check
python3 -c "import json; p=json.load(open('package.json')); assert p['private'] is True; assert p['engines']['node']=='>=22.13.0'"
```

Expected: 152 tests, typecheck clean, biome clean, assert passes.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/ci.yml .github/dependabot.yml .nvmrc \
  .gitattributes package.json
git commit -m "$(cat <<'EOF'
ci: add GitHub Actions verify workflow and Dependabot

EOF
)"
```

---

### Task 3: ADR, agent rules, and GitHub repo settings

**Files:**
- Modify: `docs/07-decisions-and-deployment.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: Tasks 1–2 files on disk
- Produces: ADR-011, CI hard rule, live GitHub metadata

- [ ] **Step 1: Append ADR-011 to docs/07**

After ADR-010 (end of file):

```markdown
## Public repository (ADR-011)

The app is a public resource, not an npm package.

- MIT at repo root (`LICENSE`), copyright 2026 chowjiaming, so GitHub
  detects the license. `package.json` stays `"license": "MIT"` and
  `"private": true` to block accidental publish.
- Visitor docs live in `README.md`. Engineering docs live in `docs/`.
  Do not duplicate domain math into the README.
- CI is GitHub Actions (`.github/workflows/ci.yml`). Deploy remains
  Netlify (`netlify.toml`). Package manager is pnpm, not Corepack
  (ADR-010).
```

- [ ] **Step 2: Add a CI bullet to AGENTS.md Hard rules** after the
pnpm lockfile bullet:

```markdown
- PRs must stay green on GitHub Actions CI (`pnpm check`, `pnpm
  typecheck`, `pnpm test`, `pnpm build`).
```

- [ ] **Step 3: Apply GitHub repository settings**

These apply to the repo, not the branch. Run them in this task.

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

- [ ] **Step 4: Verify metadata**

```bash
gh repo view chowjiaming/fixie-gears \
  --json description,homepageUrl,repositoryTopics,hasIssuesEnabled,hasWikiEnabled,hasProjectsEnabled,licenseInfo
```

Expected: description and homepage match; topics include the five
names; issues true; wiki false; projects false. `licenseInfo` may still
be null until `LICENSE` is on `main` — GitHub detects license from the
default branch. Do not fail the task on `licenseInfo` being null before
merge.

- [ ] **Step 5: `pnpm check` then commit**

```bash
pnpm check
git add docs/07-decisions-and-deployment.md AGENTS.md
git commit -m "$(cat <<'EOF'
docs: record public-repo decisions and require CI on PRs

EOF
)"
```

---

## Definition of done

- [ ] README has no Solid-template leftover copy
- [ ] `LICENSE` exists with `Copyright (c) 2026 chowjiaming`
- [ ] CoC contact is the issues URL, not an email
- [ ] `.github/workflows/ci.yml` uses `pnpm/setup@v2` and has no second
      `pnpm install`
- [ ] `package.json` `"private": true`
- [ ] `pnpm test` 152, `pnpm typecheck` and `pnpm check` clean
- [ ] GitHub description, homepage, topics set; wiki and projects off
- [ ] Private vulnerability reporting enabled
