# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] - 2026-03-09

### Added

- `debug(namespace)` — Create a debugger for a namespace; returns a `log` function
- Namespace filtering with wildcard patterns (`DEBUG=app:*,-app:db`)
- Printf-style formatting: `%s` (string), `%d` (number), `%i` (integer), `%f` (float), `%j` (JSON), `%o` (pretty object)
- `debug.enable(namespaces)` — Enable namespaces at runtime
- `debug.disable()` — Disable all namespaces
- `debug.enabled(namespace)` — Check if a namespace is enabled
- `log.destroy()` — Clean up a debugger instance
- Automatic unique color per namespace (deterministic hash)
- Time diff display between consecutive log calls
- **Node.js build** — reads from `DEBUG` env var, outputs to stderr, uses `@lpm.dev/neo.colors` (optional peer dep)
- **Browser build** — reads from `localStorage.debug`, uses `%c` console formatting for colors
- Dual conditional exports (`browser` / `node`) for automatic environment selection
- Inlined ms time formatting — no external dependency
- Zero runtime dependencies (neo.colors is optional peer dep)
- ESM + CJS output for Node.js; ESM-only for browser
- Full TypeScript types: `Debugger`, `DebugFactory`
