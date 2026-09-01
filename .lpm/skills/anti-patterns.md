---
name: anti-patterns
description: Common mistakes when using neo.debug — caching the enabled getter, object-first arguments, formatter expectations, exclusion scope, destroy behavior, and optional colors
version: "1.0.0"
globs:
  - "**/*.ts"
  - "**/*.js"
---

# Anti-Patterns for @lpm.dev/neo.debug

### [CRITICAL] Destructuring or caching the `enabled` property

Wrong:

```typescript
const log = debug('app:db')
const { enabled } = log  // Calls getter ONCE, stores a plain boolean
debug.enable('app:*')
console.log(enabled)     // Still false — stale snapshot
```

```typescript
const isEnabled = log.enabled  // Also a snapshot — not reactive
```

Correct:

```typescript
const log = debug('app:db')

// Always access .enabled directly on the instance
if (log.enabled) {
  const data = computeExpensiveDebugInfo()
  log('expensive: %j', data)
}

// In a guard function — reads getter each time
function doExpensiveWork() {
  if (!log.enabled) return
  const data = buildDebugPayload()
  log('payload: %j', data)
}
```

The `enabled` property is a getter. The getter uses the current global pattern unless you assign an instance override.

Destructuring reads the getter one time. The stored Boolean value does not change after `enable()` or `disable()`.

Source: `src/env/node.ts` and `src/env/browser.ts`

### [CRITICAL] Passing an object as the first argument

Wrong:

```typescript
const log = debug('app')
log({ error: true, code: 500 }, 'request failed')
// Output: '[object Object] request failed'
// NOT: '{"error":true,"code":500} request failed'
```

Correct:

```typescript
// First argument must be a string for format specifiers to work
log('request failed: %j', { error: true, code: 500 })
// Output: 'request failed: {"error":true,"code":500}'

// Or use %o for pretty-printed output
log('request failed: %o', { error: true, code: 500 })
```

If the first argument is not a string, all arguments are converted with `String()` and joined with spaces. No format specifiers are processed.

This argument order causes incorrect output for users of pino-style `log(data, message)` calls.

Source: `src/core/format.ts`

### [HIGH] Expecting `%o` and `%O` to use `util.inspect`

Wrong:

```typescript
const log = debug('app')

// Expecting util.inspect output (like npm debug)
log('state: %O', { nested: { deep: true } })
// Expected (npm debug): '{ nested: [Object] }'
// Actual (neo.debug):   '[object Object]'

log('buffer: %o', Buffer.from('hello'))
// Expected (npm debug): '<Buffer 68 65 6c 6c 6f>'
// Actual (neo.debug):   '{"type":"Buffer","data":[104,101,108,108,111]}'
```

Correct:

```typescript
// %o = JSON.stringify(val, null, 2) — pretty-printed JSON
log('state: %o', { nested: { deep: true } })
// Output: '{\n  "nested": {\n    "deep": true\n  }\n}'

// %O = String(val) — calls .toString()
log('state: %O', { nested: { deep: true } })
// Output: '[object Object]'

// For readable object output, use %o (JSON) or %j (compact JSON)
log('state: %j', { nested: { deep: true } })
// Output: '{"nested":{"deep":true}}'
```

neo.debug uses `JSON.stringify` for `%o` and `String()` for `%O`, not `util.inspect`. This means Maps, Sets, Buffers, class instances, and objects with custom `inspect` methods will format differently than npm `debug`.

Source: `src/core/format.ts`

### [HIGH] `%j` replaces entire circular object with `'[Circular]'`

Wrong:

```typescript
const obj = { name: 'test', data: [1, 2, 3] }
obj.self = obj

log('state: %j', obj)
// Expected: '{"name":"test","data":[1,2,3],"self":"[Circular]"}'
// Actual:   '[Circular]' — entire object replaced
```

Correct:

```typescript
// Be aware: any circular reference makes the entire %j output '[Circular]'
// If you need partial circular handling, serialize manually:
function safeStringify(obj: unknown): string {
  const seen = new WeakSet()
  return JSON.stringify(obj, (_, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]'
      seen.add(value)
    }
    return value
  })
}

log('state: %s', safeStringify(circularObj))
```

`%j` catches the `JSON.stringify` error from circular references and returns the string `'[Circular]'` for the entire value. Unlike Node.js `util.format` which marks only the circular reference, neo.debug loses all non-circular data in the object.

Source: `src/core/format.ts`

### [HIGH] Exclusion `-app:db` does not exclude sub-namespaces

Wrong:

```typescript
debug.enable('app:*,-app:db')
// AI expects this excludes app:db AND app:db:queries, app:db:connections

const dbLog = debug('app:db')
const queryLog = debug('app:db:queries')

dbLog.enabled      // false ✓
queryLog.enabled   // true ✗ — still enabled! Matches app:*
```

Correct:

```typescript
// Use a wildcard in the exclusion to match sub-namespaces
debug.enable('app:*,-app:db*')
// Excludes: app:db, app:db:queries, app:db:connections, app:dba (anything starting with app:db)

// Or be explicit
debug.enable('app:*,-app:db,-app:db:*')
// Excludes: app:db and app:db:* (but not app:dba)
```

Exclusion patterns without wildcards are exact matches. Thus, `-app:db` does not match `app:db:queries`.

Add `*` when an exclusion must match a namespace and its child namespaces.

Source: `src/core/namespace.ts`

### [MEDIUM] Assuming that `destroy()` disables a debugger

Wrong:

```typescript
const log = debug('api:request')
debug.enable('api:*')

log.destroy()
log('still visible') // The message is written.
```

Correct:

```typescript
const log = debug('api:request')
debug.enable('api:*')

log.enabled = false
log('not visible')
```

`destroy()` resets only the elapsed-time measurement. It does not disable the debugger.

Each debugger stores its timestamp in a closure. An unused debugger does not remain in a global timestamp map.

Source: `src/env/node.ts` and `src/env/browser.ts`

### [MEDIUM] Silent colors fallback — no warning when `@lpm.dev/neo.colors` is missing

Wrong:

```typescript
// AI installs neo.debug without neo.colors and wonders why output is plain text
import debug from '@lpm.dev/neo.debug'
const log = debug('app')
log('why is there no color?')  // No error, no warning — just plain text
```

Correct:

```typescript
// Install the optional peer dependency for colored output
// lpm install @lpm.dev/neo.colors

// Or accept plain text — the library works identically without colors
// The fallback is intentionally silent (no warnings, no errors)

// In browser environments, colors work automatically via %c CSS styling
// — no extra dependency needed
```

When `@lpm.dev/neo.colors` is not installed, the color palette uses identity functions. There is no runtime warning or error.

The `peerDependenciesMeta` marks the package as optional. Thus, package managers also give no warning.

If output has no color, make sure that `@lpm.dev/neo.colors` is installed.

Source: `src/env/node.ts`
