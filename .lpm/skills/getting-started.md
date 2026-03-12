---
name: getting-started
description: How to import and use neo.debug — namespace-based logging, wildcard filtering, printf formatters, time diffs, Node vs Browser setup, enable/disable API, optional colors, and TypeScript types
version: "1.0.0"
globs:
  - "**/*.ts"
  - "**/*.js"
  - "**/*.tsx"
  - "**/*.jsx"
---

# Getting Started with @lpm.dev/neo.debug

## Overview

neo.debug is a zero-dependency debugging utility with namespace-based logging, printf-style formatting, and automatic time diffs. Separate optimized builds for Node.js and Browser. 100% API compatible with npm `debug` for core features.

## Creating a Debugger

```typescript
import debug from '@lpm.dev/neo.debug'

const log = debug('app:db')
log('connected to database')
// app:db connected to database +0ms

const authLog = debug('app:auth')
authLog('user logged in: %s', 'john')
// app:auth user logged in: john +0ms
```

The factory function returns a callable debugger bound to a namespace. Create one per module/subsystem at the top level.

### Named exports

```typescript
import { debug, enable, disable } from '@lpm.dev/neo.debug'

const log = debug('app:db')
enable('app:*')
disable()
```

## Enabling Debug Output

### Node.js — `DEBUG` environment variable

```bash
# Enable one namespace
DEBUG=app:db node server.js

# Enable multiple
DEBUG=app:db,app:auth node server.js

# Wildcards
DEBUG=app:* node server.js

# Everything
DEBUG=* node server.js

# Exclude specific namespaces
DEBUG=app:*,-app:db node server.js
```

### Browser — `localStorage`

```javascript
localStorage.setItem('debug', 'app:*')
// Refresh the page — debug output appears in console
```

### Programmatic control

```typescript
import debug from '@lpm.dev/neo.debug'

debug.enable('app:*')           // Enable pattern
debug.disable()                 // Disable all
debug.enabled('app:db')         // Check if namespace is enabled (returns boolean)
```

## Namespace Filtering

Patterns support wildcards (`*`) and exclusions (`-prefix`):

```typescript
debug.enable('app:*')
// Enables: app:db, app:auth, app:cache, app:db:queries

debug.enable('app:*,-app:db')
// Enables: app:auth, app:cache, app:db:queries
// Disables: app:db (exact match only — sub-namespaces still enabled)

debug.enable('app:*,-app:db*')
// Disables: app:db AND app:db:queries, app:db:connections, etc.
```

Exclusions always take priority over inclusions, regardless of order.

Patterns can be separated by commas or spaces: `'app:*,api:*'` and `'app:* api:*'` are equivalent.

## Printf-Style Formatting

```typescript
const log = debug('app')

log('user %s has %d points', 'john', 42)
// user john has 42 points

log('request took %dms', 150)
// request took 150ms

log('config: %j', { host: 'localhost', port: 3000 })
// config: {"host":"localhost","port":3000}

log('details: %o', { nested: { deep: true } })
// details: {
//   "nested": {
//     "deep": true
//   }
// }
```

### Format specifiers

| Specifier | Description | Example |
|-----------|-------------|---------|
| `%s` | String | `log('%s', 'hello')` → `hello` |
| `%d` | Number (rounded) | `log('%d', 3.7)` → `4` |
| `%i` | Integer (truncated) | `log('%i', 3.7)` → `3` |
| `%f` | Float | `log('%f', 3.14)` → `3.14` |
| `%j` | JSON (compact) | `log('%j', obj)` → `{"key":"val"}` |
| `%o` | Pretty JSON (2-space) | `log('%o', obj)` → multiline JSON |
| `%O` | toString() | `log('%O', obj)` → `[object Object]` |

Extra arguments beyond format specifiers are appended to the output.

## Time Diffs

Each log call shows the time elapsed since the previous call for that namespace:

```typescript
const log = debug('app:db')

log('query started')           // app:db query started +0ms
// ... 150ms later
log('query complete')          // app:db query complete +150ms
// ... 2.5 seconds later
log('next query')              // app:db next query +2s
```

Time diffs are tracked per-namespace. Different debuggers have independent timers.

## Debugger Instance API

```typescript
const log = debug('app:db')

log.namespace     // 'app:db' (read-only string)
log.enabled       // true/false (getter — always reflects current state)
log.destroy()     // Cleans up internal timestamp tracking
```

### Conditional expensive work

```typescript
const log = debug('app:analytics')

function trackEvent(event: string) {
  if (!log.enabled) return  // Skip expensive serialization
  const data = computeExpensiveDebugInfo(event)
  log('event: %j', data)
}
```

## Optional Colored Output (Node.js)

Install `@lpm.dev/neo.colors` for colored namespace labels and gray time diffs:

```bash
npm install @lpm.dev/neo.colors
```

Without it, debug output works identically but without ANSI color codes. The fallback is silent — no warnings or errors.

In the browser, colors use `%c` CSS styling automatically (no extra dependency needed).

## Cleanup with destroy()

For static namespaces (created once at module load), cleanup is unnecessary. For dynamic namespaces, call `destroy()` to prevent timestamp map growth:

```typescript
// Static — no cleanup needed
const log = debug('app:db')

// Dynamic — call destroy() when done
function handleRequest(id: string) {
  const log = debug(`app:req:${id}`)
  log('processing')
  // ... work ...
  log.destroy()
}
```

## TypeScript Types

```typescript
import type { Debugger, DebugFactory } from '@lpm.dev/neo.debug'

// Debugger — the callable instance returned by debug()
// DebugFactory — the factory function with enable/disable/enabled
```

## Output Target

- **Node.js**: writes to `process.stderr` (standard debug convention)
- **Browser**: writes to `console.log` with `%c` CSS color styling
