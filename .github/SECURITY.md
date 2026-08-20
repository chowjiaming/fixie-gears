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
