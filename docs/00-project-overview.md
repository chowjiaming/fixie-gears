# Fixie Gears — Project Overview

## Vision

An interactive web app for fixed-gear and single-speed cyclists to configure,
compare, and understand gear ratios. The core loop: a rider picks a chainring,
cog, wheel/tire, and crank length, and instantly sees every derived metric that
matters (gear inches, development, gain ratio, speed at cadence, skid patches),
plus visualizations that build intuition.

## Audience

**v1 primary job:** street fixie at the shop — pick a ratio, see skid patches,
share the setup.

Track racers and curious commuters are welcome; they get the same calculator
plus named ring/cog presets. They do **not** get a second “track mode,” a
gear-inch target, or “best gear” highlighting.

- Fixed-gear riders choosing a street setup (primary)
- Riders optimizing skid patch counts to extend tire life (primary)
- Track racers applying a ring/cog preset onto their wheel
- Curious commuters comparing single-speed options

## Design Principles

1. **Instant feedback.** Every input change recomputes everything
   synchronously. No submit buttons, no loading states for core math.
2. **URL as source of truth.** The drivetrain configuration lives in the URL
   search string on **every** route, so the current bike survives navigation
   and every view is shareable by link.
3. **Local computation.** All math runs in the browser. No backend in v1.
   Do not advertise “offline-first” in the UI or README until a PWA exists
   (v2).
4. **Teach, don't just tell.** Tooltips and inline explanations for every
   metric (many riders don't know what gain ratio or development means).
5. **Mobile-first.** Riders use this at the bike shop and the velodrome.

## Scope

### v1 (this build)

- Gear calculator (chainring, cog, wheel size, tire width, crank length)
- Derived metrics: ratio, gear inches, meters of development, gain ratio,
  skid patches, speed-at-cadence table
- Skid patch calculator + radial visualizer
- Setup comparison (2–4 setups; column 1 is the current bike)
- Ratio explorer heatmap (chainring × cog grid)
- Saved setups (localStorage), shareable URLs
- Metric/imperial unit toggle, dark mode

### v2 (deferred, design for extensibility)

- Chain length calculator (chainstay length input)
- Gear range warnings (chain tension, ratio legality for track events)
- Measured tire circumference override
- 650c wheel size, free-form crank millimetres, gear-inch target
- PWA install + offline manifest
- User accounts / cloud sync (would justify TanStack Start server functions)

## Non-goals

- Geared/derailleur drivetrains (internally geared hubs maybe later)
- Power/speed physics modeling (wind, grade, rider weight)
- E-commerce or parts databases
- Claiming the site works without a network in v1
