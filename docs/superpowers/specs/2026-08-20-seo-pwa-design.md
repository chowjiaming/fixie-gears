# SEO + installable PWA

**Date:** 2026-08-20
**Status:** approved design; implementation not started
**Origin:** `https://fixie-gears.netlify.app` (no trailing slash)

Discoverability plus an installable app-shell PWA. One site-wide Open
Graph card. No Edge Functions. No per-setup unfurls.

This file lives on the feature branch only. The last implementation
task deletes `docs/superpowers/` so `main` keeps the four handbook
pages. Durable rules land in ADR-003, `docs/architecture.md`,
`AGENTS.md`, and one README sentence.

## Job

After this ships:

1. Crawlers get a real `robots.txt`, a four-URL sitemap, a meta
   description, and a working favicon (the live `/favicon.ico` is a
   500 today; `/robots.txt` is the SPA HTML fallback).
2. Sharing any app URL shows the same title, description, and
   `og.png`.
3. The site is installable (`display: standalone`).
4. After a successful first load, `/`, `/compare`, `/explore`, and
   `/saved` boot with the network off.

Lighthouse’s PWA category is gone (May 2024). There is no PWA score to
chase. SEO should pick up description + robots; that is the 82 →
green path.

## Constraints

- Solid 2.0 APIs only. No `onMount`.
- `v` stays `1`. No search-schema or `src/lib/gear/` changes.
- Package manager pnpm. No `package-lock.json`. No Corepack.
- New **devDependency** only: `vite-plugin-pwa` (1.3.0 or later on the
  1.x line whose peer range includes Vite 8). Do not add Workbox or
  `@vite-pwa/assets-generator` as direct dependencies. Do not bump
  `solid-js` or TanStack.
- Head tags live in `src/Document.tsx`. There is no `index.html`.
- Netlify publish dir remains `dist/client`. Files that exist there
  are served before the `/*` → `/index.html` fallback.

## Copy

One title and one description everywhere they appear (`<title>`,
`og:title`, `twitter:title`, manifest `name` / `short_name`;
`meta name="description"`, `og:description`, `twitter:description`,
manifest `description`):

| Field | Value |
| --- | --- |
| Title / name / short_name | `Fixie Gears` |
| Description | `Street-fixie ratio calculator. Gear inches, development, skid patches, and chain links — every setup is a URL.` |

No per-route titles. No JSON-LD. No `twitter:site`.

Canonical, `og:url`, robots sitemap line, and every `<loc>` use the
production origin above, including on Netlify deploy previews.

`og:image` is `https://fixie-gears.netlify.app/og.png`.
`og:image:alt` is `Fixie Gears — street-fixie ratio calculator`.
`og:type` is `website`. `og:image:width` / `height` are `1200` / `630`.
Twitter card is `summary_large_image`.
`theme-color` is `#FF5A1F` (one tag, no media query).

Put the origin in `src/lib/site.ts` as `SITE_ORIGIN`
(`https://fixie-gears.netlify.app`, no trailing slash) and use it from
`Document.tsx`. `public/robots.txt` and `public/sitemap.xml` hardcode
the same origin; a test asserts they match `SITE_ORIGIN` so they
cannot drift. Manifest `id` is the origin **with** a trailing slash
(`https://fixie-gears.netlify.app/`) — that is the install identity,
not the canonical URL, and must not be “fixed” to match `SITE_ORIGIN`.

## Static files (`public/`)

| File | Role |
| --- | --- |
| `robots.txt` | `User-agent: *` / `Allow: /` / sitemap line |
| `sitemap.xml` | `/`, `/compare`, `/explore`, `/saved` only — no query strings |
| `favicon.svg` | Vector favicon |
| `favicon.ico` | Legacy; `Document.tsx` keeps a `rel="icon"` pointing here **and** at the SVG |
| `apple-touch-icon.png` | 180×180 |
| `pwa-192.png` / `pwa-512.png` | Manifest `purpose: "any"` |
| `pwa-192-maskable.png` / `pwa-512-maskable.png` | Manifest `purpose: "maskable"`; mark inside the 80% safe zone |
| `og.png` | 1200×630 share card |

Palette is existing tokens only: accent `#FF5A1F`, paper `#FAFAF8`,
ink `#111214`. No photo, no app screenshot. OG composition: paper
field, accent wordmark **Fixie Gears**, ink subtitle = the
description’s first sentence, a simple chainring mark.

Commit the binaries. Do not generate them at build time.

## Plugin and registration

`vite.config.ts` adds `VitePWA(...)` in the same `VITEST` skip list
as the TanStack router plugin (the plugin does not run under Vitest).

Required options:

- `strategies: 'generateSW'`
- `registerType: 'autoUpdate'` (skipWaiting + clientsClaim)
- `injectRegister: false` — we register ourselves
- `devOptions.enabled: false` — `pnpm dev` never installs a worker
- `manifest.id`: `https://fixie-gears.netlify.app/`
- `manifest.start_url`: `/`
- `manifest.scope`: `/`
- `manifest.display`: `standalone`
- `manifest.background_color`: `#FAFAF8`
- `manifest.theme_color`: `#FF5A1F`
- `manifest.lang`: `en`
- `workbox.navigateFallback`: `index.html`
- `filename`: `sw.js`
- `manifestFilename`: `manifest.webmanifest`
- `workbox.cleanupOutdatedCaches`: `true`
- Precache JS, CSS, HTML, icons, `og.png`, `robots.txt`,
  `sitemap.xml`, and the webmanifest. No runtime CDN caching.

Service worker and webmanifest **must** land in `dist/client`. If the
plugin follows Vite `build.outDir` and that is already `dist/client`,
do not set `outDir`. If they emit elsewhere, set `outDir` to
`dist/client`.

`src/pwa.ts` imports `registerSW` from `virtual:pwa-register` and
calls `registerSW({ immediate: true })`. `App.tsx` imports `~/pwa`.
Not `onMount`. Not a hand-written script in `Document.tsx`.

Vitest: alias `virtual:pwa-register` to a stub that exports
`registerSW` as a no-op, so `App.tsx` can keep a static import while
the plugin is skipped. Add `vite-plugin-pwa/client` to
`tsconfig.json` `compilerOptions.types` (the array currently lists
only `vite/client` and `node`).

`Document.tsx` also includes
`<link rel="manifest" href="/manifest.webmanifest" />`. After the
first production build, `dist/client/index.html` must contain
**exactly one** manifest link and **no** plugin-injected register
script. If the plugin duplicated the link via `transformIndexHtml`,
fix the config so Document remains the only head owner.

## Runtime

The worker is progressive enhancement. Online without a worker, the
site is unchanged. First visit needs the network. After that, the
shell (four routes, hashed assets, icons) comes from the precache.
Calculator math, URL search, prefs, and saved bikes stay local, so
they work offline with whatever was already in `localStorage`.

Updates: a new deploy installs a new worker and takes over; the next
navigation or reload gets the new shell. No in-app update toast.

Install: browser-native only. No `beforeinstallprompt` UI.

Failures: register error is ignored (keep using the network). First
visit while offline is the browser’s own offline page — no in-app
“you’re offline” chrome.

## Docs (durable)

- **ADR-003:** still Netlify static / `dist/client` / SPA fallback /
  no router basepath. Add: installable PWA via `vite-plugin-pwa`
  `generateSW`; app-shell offline after the first successful visit;
  still do not pitch the product as offline-first; still do not claim
  it works without ever having had a network.
- **`docs/architecture.md`:** stack row for PWA
  (`vite-plugin-pwa` / Workbox `generateSW`). Layout may show
  `public/` and `src/pwa.ts`.
- **`AGENTS.md`:** replace “Do not claim offline-first in UI copy”
  with the ADR-003 wording (shell works offline after the first
  successful visit; do not describe the product as offline-first).
- **README:** one sentence after the existing “no backend” line:
  after the first visit, the app shell works offline.

## Tests

Do not boot a service worker in Vitest. Do not add Lighthouse,
Playwright, or a new runtime dependency.

- Head: `Document.tsx` emits the description, canonical,
  `theme-color` `#FF5A1F`, OG/Twitter tags, SVG + ICO icon links,
  apple-touch icon, and the manifest link.
- Static: `public/robots.txt` and `public/sitemap.xml` exist, are not
  HTML, name `SITE_ORIGIN`, and list exactly the four routes.
- After `pnpm build` in `.github/workflows/ci.yml`, a step asserts
  `dist/client/index.html`, `dist/client/manifest.webmanifest`, and
  `dist/client/sw.js` exist. Do not add a second workflow. Vitest does
  not depend on `dist/`.

Existing test count must not drop. `pnpm test`, `pnpm typecheck`,
`pnpm check`, and `pnpm build` must pass.

## Out of scope

Per-setup OG, Edge Functions, push, background sync, custom install
UI, per-route titles, JSON-LD, Lighthouse PWA score, claiming the
site works without a first network visit.

## Done when (production)

- `https://fixie-gears.netlify.app/robots.txt` is a robots file
- `https://fixie-gears.netlify.app/sitemap.xml` is XML with four URLs
- `https://fixie-gears.netlify.app/favicon.ico` is not a 500
- Sharing any app URL shows the one OG card
- DevTools shows a manifest and a controlling worker
- A second visit to each of the four routes with the network off
  still boots the shell
