# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Fixed

- Added CommonJS declarations and named CommonJS properties.
- Shared the Node.js enable state between ESM and CommonJS consumers.
- Added per-instance `enabled` overrides and compatible `disable()` return values.
- Neutralized terminal control characters and bounded stderr backpressure.
- Added `%%` formatting and corrected the published documentation.
- Updated the locked `nanoid` version to remove GHSA-2v37-7h3g-55p8.

## [1.0.0] - 2026-03-09

### Added

- `debug(namespace)` — Create a debugger for a namespace. It returns a `log` function.
- Namespace filtering with wildcard patterns (`DEBUG=app:*,-app:db`)
- Printf-style formatting: `%s` (string), `%d` (number), `%i` (integer), `%f` (float), `%j` (JSON), `%o` (pretty object)
- `debug.enable(namespaces)` — Enable namespaces at runtime
- `debug.disable()` — Disable all namespaces
- `debug.enabled(namespace)` — Check if a namespace is enabled
- `log.destroy()` — Clean up a debugger instance
- Automatic deterministic color selection for each namespace
- Time diff display between consecutive log calls
- **Node.js build** — reads from `DEBUG` env var, outputs to stderr, uses `@lpm.dev/neo.colors` (optional peer dep)
- **Browser build** — reads from `localStorage.debug`, uses `%c` console formatting for colors
- Dual conditional exports (`browser` / `node`) for automatic environment selection
- Inlined ms time formatting — no external dependency
- Zero runtime dependencies (neo.colors is optional peer dep)
- ESM and CJS output for Node.js. The browser output uses ESM.
- Full TypeScript types: `Debugger`, `DebugFactory`
