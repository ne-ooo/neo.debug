# @lpm.dev/neo.debug

> **Zero-dependency debugging utility** - Fast, modern alternative to debug

[![npm version](https://img.shields.io/npm/v/@lpm.dev/neo.debug.svg)](https://www.npmjs.com/package/@lpm.dev/neo.debug)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/@lpm.dev/neo.debug)](https://bundlephobia.com/package/@lpm.dev/neo.debug)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **Zero dependencies** - Inline ms package, optional neo.colors
- ✅ **Dual environment** - Separate optimized builds for Node.js and Browser
- ✅ **Smaller bundles** - Node ~5KB, Browser ~5KB
- ✅ **100% debug-compatible API** - Drop-in replacement
- ✅ **Full TypeScript support** - Strict mode, complete types
- ✅ **ESM + CommonJS** - Both module systems (Node only)
- ✅ **Namespace filtering** - Wildcard patterns (`DEBUG=app:*,-app:db`)
- ✅ **Printf-style formatting** - `debug('user %s has %d points', name, score)`
- ✅ **Automatic colors** - Each namespace gets a unique color
- ✅ **Time diff display** - Shows elapsed time between log calls
- ✅ **100% test coverage** - Battle-tested with 65+ tests

## Quick Start

### Node.js

```bash
lpm install @lpm.dev/neo.debug
# Optional: Install neo.colors for colored output
lpm install @lpm.dev/neo.colors
```

```typescript
import debug from '@lpm.dev/neo.debug'

const log = debug('app:server')

log('Server starting on port %d', 3000)
// app:server Server starting on port 3000 +0ms

log('User %s logged in', 'john')
// app:server User john logged in +5ms
```

### Browser

```typescript
import debug from '@lpm.dev/neo.debug'

const log = debug('app:ui')

// Enable via localStorage
localStorage.setItem('debug', 'app:*')

log('Component mounted')
// app:ui Component mounted +0ms
```

## Why @lpm.dev/neo.debug?

### The Original debug Package Has Limitations

- Has 1 dependency (ms package)
- Bundle includes both Node and Browser code
- No native TypeScript support (separate .d.ts file)
- Uses older JavaScript patterns

### neo.debug Modernizes Everything

Built from the ground up with:
- Zero runtime dependencies (inlined ms package)
- Separate optimized builds for Node.js and Browser
- TypeScript-first architecture
- Modern JavaScript features (ESM-first)
- Conditional exports for perfect tree-shaking

## API

### Creating Debuggers

```typescript
import debug from '@lpm.dev/neo.debug'

// Create a debugger for a namespace
const log = debug('app:db')

// Log messages
log('Query executed')
log('User %s found', 'john')
log('Query took %dms', 42)
```

### Namespace Filtering

#### Node.js (via DEBUG env var)

```bash
# Enable all
DEBUG=* node app.js

# Enable specific namespace
DEBUG=app:db node app.js

# Enable with wildcard
DEBUG=app:* node app.js

# Enable multiple namespaces
DEBUG=app:*,api:* node app.js

# Exclude specific namespaces
DEBUG=app:*,-app:db node app.js
```

#### Browser (via localStorage)

```javascript
// Enable all
localStorage.setItem('debug', '*')

// Enable specific namespace
localStorage.setItem('debug', 'app:ui')

// Enable with wildcard
localStorage.setItem('debug', 'app:*')

// Exclude specific namespaces
localStorage.setItem('debug', 'app:*,-app:db')
```

### Printf-Style Formatting

```typescript
const log = debug('app')

// %s - String
log('user %s', 'john')
// → user john

// %d - Number
log('count %d', 42)
// → count 42

// %i - Integer
log('int %i', 3.14)
// → int 3

// %f - Float
log('pi %f', 3.14)
// → pi 3.14

// %j - JSON
log('data %j', { foo: 'bar' })
// → data {"foo":"bar"}

// %o - Object (pretty printed)
log('obj %o', { foo: 'bar' })
// → obj {
//     "foo": "bar"
//   }

// Multiple formatters
log('user %s has %d points', 'john', 42)
// → user john has 42 points
```

### Runtime Control

```typescript
import debug from '@lpm.dev/neo.debug'

// Enable namespaces at runtime
debug.enable('app:*')

// Disable all
debug.disable()

// Check if a namespace is enabled
if (debug.enabled('app:db')) {
  console.log('Debugging enabled')
}
```

### Destroying Debuggers

```typescript
const log = debug('app:temp')

log('Message')

// Cleanup when done
log.destroy()
```

## Environment Detection

### Node.js

Reads from `DEBUG` environment variable:

```bash
DEBUG=app:* node app.js
```

Uses `@lpm.dev/neo.colors` for terminal colors (if installed):
- Each namespace gets a unique color
- Time diffs shown in gray
- Outputs to `stderr` (debug convention)

### Browser

Reads from `localStorage.debug`:

```javascript
localStorage.setItem('debug', 'app:*')
```

Uses `%c` console formatting for colors:
- Each namespace gets a unique CSS color
- Time diffs shown in gray
- Outputs to `console.log`

## TypeScript

```typescript
import debug, { Debugger, DebugFactory } from '@lpm.dev/neo.debug'

const log: Debugger = debug('app:server')

// All types are exported
import type { Debugger, DebugFactory } from '@lpm.dev/neo.debug'
```

## Migration from debug

@lpm.dev/neo.debug is a **drop-in replacement** for debug:

```diff
- import debug from 'debug'
+ import debug from '@lpm.dev/neo.debug'

const log = debug('app:server')
log('Server started')
```

### API Compatibility

99% compatible with original debug package:
- ✅ Namespace filtering with wildcards
- ✅ Printf-style formatting
- ✅ enable/disable/enabled methods
- ✅ DEBUG environment variable (Node)
- ✅ localStorage (Browser)
- ✅ Automatic color assignment
- ✅ Time diff display

## Examples

### Express Server

```typescript
import express from 'express'
import debug from '@lpm.dev/neo.debug'

const log = debug('app:server')
const dbLog = debug('app:db')

const app = express()

app.get('/users/:id', async (req, res) => {
  log('GET /users/%s', req.params.id)

  dbLog('Querying user %s', req.params.id)
  const user = await db.findUser(req.params.id)
  dbLog('Query completed in %dms', 42)

  res.json(user)
})

app.listen(3000, () => {
  log('Server listening on port %d', 3000)
})
```

```bash
# Enable all app logs
DEBUG=app:* node server.js

# Enable only database logs
DEBUG=app:db node server.js

# Enable all except database
DEBUG=app:*,-app:db node server.js
```

### React Component

```typescript
import { useEffect } from 'react'
import debug from '@lpm.dev/neo.debug'

const log = debug('app:UserProfile')

export function UserProfile({ userId }: { userId: string }) {
  useEffect(() => {
    log('Mounting UserProfile for user %s', userId)

    return () => {
      log('Unmounting UserProfile')
    }
  }, [userId])

  return <div>Profile for {userId}</div>
}
```

```javascript
// In browser console
localStorage.setItem('debug', 'app:*')
// Reload page to see logs
```

### Worker Queue

```typescript
import debug from '@lpm.dev/neo.debug'

const log = debug('worker:queue')
const taskLog = debug('worker:task')

class JobQueue {
  async processJob(job: Job) {
    log('Processing job %s', job.id)

    taskLog('Task %s started', job.task)
    await job.execute()
    taskLog('Task %s completed in %dms', job.task, job.duration)

    log('Job %s completed', job.id)
  }
}
```

```bash
# See all worker logs
DEBUG=worker:* node worker.js

# See only task logs
DEBUG=worker:task node worker.js
```

## Bundle Sizes

### Node.js Build
- ESM: ~5.4 KB
- CommonJS: ~6.1 KB
- Includes: Core + Node env + inlined ms
- Excludes: Browser code

### Browser Build
- ESM: ~5.0 KB
- Includes: Core + Browser env + inlined ms
- Excludes: Node.js code, neo.colors dependency

## Performance

- Fast namespace filtering with regex caching
- Deterministic color hashing (same namespace = same color)
- Minimal overhead when disabled
- Zero allocations for disabled namespaces

## Browser Support

Works in all modern browsers with:
- `localStorage` support
- `console.log` with `%c` formatting

## Node.js Support

Requires Node.js >= 18.0.0

## License

MIT © neo

## Credits

Inspired by [debug](https://github.com/debug-js/debug) and built with modern JavaScript.
