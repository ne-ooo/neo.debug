---
name: anti-patterns
description: Common mistakes when using neo.debug — destructuring the enabled getter, object-first arguments, %o/%O expectations, %j circular handling, exclusion pattern scope, dynamic namespace leaks, silent colors fallback
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

`enabled` is defined via `Object.defineProperty` as a getter. Every access calls `isNamespaceEnabled()` against the current global pattern state. Destructuring or assigning to a variable calls the getter once and stores the boolean — it becomes a stale snapshot that never updates when `enable()`/`disable()` is called. The TypeScript type shows `enabled: boolean`, making the getter behavior invisible to the type system.

Source: `src/env/node.ts:106-111` — `Object.defineProperty` getter

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

If the first argument is not a string, all arguments are converted with `String()` and joined with spaces. No format specifiers are processed. An AI familiar with pino-style `log(data, message)` ordering would hit this.

Source: `src/core/format.ts:55-57` — `typeof fmt !== 'string'` check

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

Source: `src/core/format.ts:27-35` — JSON.stringify for `%o`, String() for `%O`

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

Source: `src/core/format.ts:19-26` — try/catch around JSON.stringify

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

Exclusion patterns without wildcards are exact matches — `-app:db` becomes the regex `^app:db$` which only matches the literal string `app:db`, not `app:db:queries`. Always add `*` to exclusion patterns when you want to exclude a namespace and all its children.

Source: `src/core/namespace.ts:43-56` — `*` converts to `.*?` regex, no `*` means exact match with `^...$` anchors

### [MEDIUM] Dynamic namespaces without `destroy()` leak timestamps

Wrong:

```typescript
app.get('/api/:id', (req, res) => {
  const log = debug(`api:request:${req.params.id}`)
  log('processing request')
  // log goes out of scope, but prevTimestamps Map still holds the entry
})
// After 100K requests: 100K entries in prevTimestamps (unbounded growth)
```

Correct:

```typescript
// Option 1: Call destroy() when done
app.get('/api/:id', (req, res) => {
  const log = debug(`api:request:${req.params.id}`)
  log('processing request')
  // ... handle request
  log.destroy()  // Removes prevTimestamps entry
})

// Option 2 (better): Use a static namespace with data in the message
const log = debug('api:request')

app.get('/api/:id', (req, res) => {
  log('processing %s', req.params.id)  // One debugger, no leak
})
```

`destroy()` only removes the namespace's entry from the internal `prevTimestamps` Map used for time diff display. For static namespaces (created once at module load), this is irrelevant. For dynamic namespaces created per-request or in loops, the Map grows without bound. Each entry is small (string key + number), but it never shrinks.

Source: `src/env/node.ts:112-115` — `prevTimestamps.delete(namespace)`

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
// npm install @lpm.dev/neo.colors

// Or accept plain text — the library works identically without colors
// The fallback is intentionally silent (no warnings, no errors)

// In browser environments, colors work automatically via %c CSS styling
// — no extra dependency needed
```

When `@lpm.dev/neo.colors` is not installed, the color palette falls back to identity functions (no-op). There is no runtime warning or error. The `peerDependenciesMeta` marks it as `optional: true`, so package managers also don't warn. If you see colored output in one project but not another, check whether `@lpm.dev/neo.colors` is installed.

Source: `src/env/node.ts:18-55` — try/catch with identity function fallback
