---
name: migrate-from-debug
description: Step-by-step guide for migrating from the npm debug package to neo.debug — import changes, 1:1 compatible features, subtle differences in %o/%O/%j formatting, missing features (custom formatters, extend, log override), and color palette changes
version: "1.0.0"
globs:
  - "**/*.ts"
  - "**/*.js"
---

# Migrate from debug to @lpm.dev/neo.debug

## Quick Comparison

| Aspect | npm debug | neo.debug |
|--------|-----------|-----------|
| Dependencies | 1 (ms) | Zero (ms inlined) |
| Bundle size | ~5KB | ~5KB (separate Node/Browser builds) |
| TypeScript | Separate @types/debug | Native TypeScript |
| Module format | CJS-first | ESM-first (with CJS fallback) |
| Node.js colors | Hard dependency (supports) | Optional peer dep (@lpm.dev/neo.colors) |
| Color palette | 76 ANSI256 colors | 6 basic colors |
| `%o`/`%O` engine | util.inspect | JSON.stringify / String() |
| Custom formatters | `debug.formatters.x = ...` | Not supported |
| `extend()` | Yes | Not supported |
| `debug.log` override | Yes | Not supported |

## Step 1: Replace the Import

```typescript
// Before (npm debug)
import debug from 'debug'
// or
const debug = require('debug')

// After (neo.debug) — default export works the same
import debug from '@lpm.dev/neo.debug'

// Named exports also available
import { debug, enable, disable } from '@lpm.dev/neo.debug'
```

The default export API is identical. No code changes needed for the import itself.

## Step 2: All Core Features Work As-Is

These features are 1:1 compatible with no changes:

```typescript
// Factory function
const log = debug('app:db')             // ✓ Identical

// Logging with format specifiers
log('user %s connected', 'john')        // ✓ Identical
log('query took %dms', 42)              // ✓ Identical
log('config: %j', { port: 3000 })       // ✓ Identical

// Namespace properties
log.namespace                            // ✓ 'app:db'
log.enabled                              // ✓ getter (reactive)
log.destroy()                            // ✓ cleanup

// Enable/disable
debug.enable('app:*')                    // ✓ Identical
debug.disable()                          // ✓ Identical
debug.enabled('app:db')                  // ✓ Identical

// Wildcards and exclusions
debug.enable('app:*,-app:db')            // ✓ Identical

// Environment variables
// DEBUG=app:* node server.js            // ✓ Identical

// Browser localStorage
// localStorage.setItem('debug', 'app:*') // ✓ Identical
```

## Step 3: Handle Subtle Differences

### `%o` and `%O` — different formatting engine

This is the biggest behavioral difference:

```typescript
const data = { users: [{ name: 'john', role: 'admin' }] }

// npm debug — uses util.inspect
log('data: %o', data)
// → data: { users: [ { name: 'john', role: 'admin' } ] }

// neo.debug — uses JSON.stringify(val, null, 2)
log('data: %o', data)
// → data: {
//     "users": [
//       {
//         "name": "john",
//         "role": "admin"
//       }
//     ]
//   }
```

```typescript
// npm debug — %O uses util.inspect with depth=2
log('data: %O', data)
// → data: { users: [Array] }

// neo.debug — %O uses String(val)
log('data: %O', data)
// → data: [object Object]
```

**Impact:** Objects with Maps, Sets, Buffers, class instances, or custom `inspect` methods will format differently. Plain JSON-serializable objects produce equivalent (but differently formatted) output.

### `%j` circular reference handling

```typescript
const obj = { name: 'test' }
obj.self = obj

// npm debug — util.inspect fallback (shows partial structure)
log('state: %j', obj)

// neo.debug — entire output replaced
log('state: %j', obj)
// → state: [Circular]
```

neo.debug's `%j` catches the `JSON.stringify` error and returns `'[Circular]'` for the entire value. No partial circular marking.

### Color palette

npm `debug` uses 76 ANSI256 colors. neo.debug uses 6 basic colors (cyan, magenta, blue, yellow, green, red). After migration, namespaces will have different colors. Functionality is unaffected.

### Colors dependency

```bash
# npm debug — colors work out of the box via supports-color
npm install debug

# neo.debug — install optional peer dep for colored output
npm install @lpm.dev/neo.debug @lpm.dev/neo.colors
# Or skip neo.colors for plain text output (no warnings, silent fallback)
```

## Step 4: Handle Missing Features

### No custom formatters

```typescript
// npm debug — add custom %h formatter
debug.formatters.h = (v) => v.toString('hex')
log('buffer: %h', buf)

// neo.debug — no formatter extension API
// Workaround: format inline
log('buffer: %s', buf.toString('hex'))
```

### No `extend()` method

```typescript
// npm debug
const log = debug('app')
const dbLog = log.extend('db')  // Creates 'app:db'

// neo.debug — create a new debugger directly
const log = debug('app')
const dbLog = debug('app:db')   // Same result
```

### No `debug.log` output override

```typescript
// npm debug — redirect output
const log = debug('app')
log.log = console.info  // Send to stdout instead of stderr

// neo.debug — no override mechanism
// Node.js always writes to process.stderr
// Browser always writes to console.log
```

### No `DEBUG_COLORS`, `DEBUG_HIDE_DATE`, `DEBUG_SHOW_HIDDEN` env vars

npm `debug` supports several environment variables for output control. neo.debug does not read these — output format is fixed.

## Migration Checklist

- [ ] Replace `import debug from 'debug'` with `import debug from '@lpm.dev/neo.debug'`
- [ ] Install `@lpm.dev/neo.colors` if you want colored output in Node.js
- [ ] Audit `%o` usage — output is now pretty-printed JSON instead of `util.inspect`
- [ ] Audit `%O` usage — output is now `[object Object]` instead of shallow `util.inspect`
- [ ] Remove custom formatter assignments (`debug.formatters.x = ...`) — not supported
- [ ] Replace `log.extend('sub')` with `debug('namespace:sub')`
- [ ] Replace `log.log = console.info` with direct stderr/stdout handling if needed
- [ ] Remove `@types/debug` from devDependencies (types are built-in)
- [ ] Remove `debug` and `ms` from dependencies
- [ ] Add `@lpm.dev/neo.debug` to dependencies
