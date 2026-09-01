# @lpm.dev/neo.debug

`@lpm.dev/neo.debug` writes namespace-filtered diagnostic messages in Node.js
and browsers.

## Features

- **Namespace filters:** Supports exact names, wildcards, lists, and exclusions.
- **Formatting:** Supports common printf-style placeholders and elapsed-time
  output.
- **Environment builds:** Provides separate Node.js and browser implementations.
- **Compatibility:** Supports the common `debug` factory and runtime controls.
- **TypeScript support:** Includes strict type declarations.
- **Dependency surface:** Has no required runtime dependencies. Terminal colors
  use optional `@lpm.dev/neo.colors` integration.

## Install

Install the package with LPM:

```bash
lpm install @lpm.dev/neo.debug
```

Install the optional terminal-color integration:

```bash
lpm install @lpm.dev/neo.colors
```

## Quick start

### Node.js

```typescript
import debug from "@lpm.dev/neo.debug";

debug.enable("app:*");
const log = debug("app:server");

log("Server starting on port %d", 3000);
// app:server Server starting on port 3000

log("User %s logged in", "john");
// app:server User john logged in +5ms
```

### Browser

```typescript
import debug from "@lpm.dev/neo.debug";

const log = debug("app:ui");

// This also saves the pattern in localStorage.
debug.enable("app:*");

log("Component mounted");
// app:ui Component mounted
```

## API

### `debug(namespace): Debugger`

Creates a debugger for a namespace.

```typescript
import debug from "@lpm.dev/neo.debug";

// Create a debugger for a namespace
const log = debug("app:db");

// Log messages
log("Query executed");
log("User %s found", "john");
log("Query took %dms", 42);
```

### Namespace filtering

#### Node.js with `DEBUG`

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

#### Browser with `localStorage`

```javascript
// Enable all
localStorage.setItem("debug", "*");

// Enable specific namespace
localStorage.setItem("debug", "app:ui");

// Enable with wildcard
localStorage.setItem("debug", "app:*");

// Exclude specific namespaces
localStorage.setItem("debug", "app:*,-app:db");
```

### Printf-style formatting

```typescript
const log = debug("app");

// %s - String
log("user %s", "john");
// → user john

// %d - Number
log("count %d", 42);
// → count 42

// %i - Integer
log("int %i", 3.14);
// → int 3

// %f - Float
log("pi %f", 3.14);
// → pi 3.14

// %j - JSON
log("data %j", { foo: "bar" });
// → data {"foo":"bar"}

// %o - Object (pretty printed)
log("obj %o", { foo: "bar" });
// → obj {
//     "foo": "bar"
//   }

// Multiple formatters
log("user %s has %d points", "john", 42);
// → user john has 42 points
```

### Runtime control

```typescript
import debug from "@lpm.dev/neo.debug";

// Enable namespaces at runtime
debug.enable("app:*");

// Disable all and get the previous pattern.
const previousNamespaces = debug.disable();

// Restore the previous pattern.
debug.enable(previousNamespaces);

// Check if a namespace is enabled
if (debug.enabled("app:db")) {
  console.log("Debugging enabled");
}
```

### `debugger.destroy(): void`

```typescript
const log = debug("app:temp");

log("Message");

// Reset the elapsed-time measurement for this debugger.
log.destroy();
```

## Behavior and limits

### Node.js

The Node.js build reads the `DEBUG` environment variable:

```bash
DEBUG=app:* node app.js
```

The Node.js build uses `@lpm.dev/neo.colors` for terminal colors when the
optional package is installed:

- Each namespace gets a deterministic palette color
- Time diffs shown in gray
- Outputs to `stderr` (debug convention)

### Browser

The browser build reads `localStorage.debug`:

```javascript
localStorage.setItem("debug", "app:*");
```

The browser build uses `%c` console formatting for colors:

- Each namespace gets a deterministic CSS palette color
- Time diffs shown in gray
- Outputs to `console.log`

### TypeScript example

```typescript
import debug, { DebugFactory, Debugger } from "@lpm.dev/neo.debug";

const log: Debugger = debug("app:server");

// All types are exported
import type { DebugFactory, Debugger } from "@lpm.dev/neo.debug";
```

## Migration from `debug`

The package supports the common `debug` factory and runtime controls:

```diff
- import debug from 'debug'
+ import debug from '@lpm.dev/neo.debug'

const log = debug('app:server')
log('Server started')
```

### API compatibility

The common API includes:

- Namespace filtering with wildcards
- Printf-style formatting
- The `enable()`, `disable()`, and `enabled()` methods
- The `DEBUG` environment variable in Node.js
- `localStorage` in browsers
- Automatic color assignment
- Elapsed-time output

The packages are not identical. This package does not support custom formatters,
`extend()`, or a `log` override.

The `%o`, `%O`, and `%j` formatters have documented output differences. Run the
application tests after the migration.

## Examples

### Express server

```typescript
import express from "express";
import debug from "@lpm.dev/neo.debug";

const log = debug("app:server");
const dbLog = debug("app:db");

const app = express();

app.get("/users/:id", async (req, res) => {
  log("GET /users/%s", req.params.id);

  dbLog("Querying user %s", req.params.id);
  const user = await db.findUser(req.params.id);
  dbLog("Query completed in %dms", 42);

  res.json(user);
});

app.listen(3000, () => {
  log("Server listening on port %d", 3000);
});
```

```bash
# Enable all app logs
DEBUG=app:* node server.js

# Enable only database logs
DEBUG=app:db node server.js

# Enable all except database
DEBUG=app:*,-app:db node server.js
```

### React component

```typescript
import { useEffect } from "react";
import debug from "@lpm.dev/neo.debug";

const log = debug("app:UserProfile");

export function UserProfile({ userId }: { userId: string }) {
  useEffect(() => {
    log("Mounting UserProfile for user %s", userId);

    return () => {
      log("Unmounting UserProfile");
    };
  }, [userId]);

  return <div>Profile for {userId}</div>;
}
```

```javascript
// In browser console
localStorage.setItem("debug", "app:*");
// Reload page to see logs
```

### Worker queue

```typescript
import debug from "@lpm.dev/neo.debug";

const log = debug("worker:queue");
const taskLog = debug("worker:task");

class JobQueue {
  async processJob(job: Job) {
    log("Processing job %s", job.id);

    taskLog("Task %s started", job.task);
    await job.execute();
    taskLog("Task %s completed in %dms", job.task, job.duration);

    log("Job %s completed", job.id);
  }
}
```

```bash
# See all worker logs
DEBUG=worker:* node worker.js

# See only task logs
DEBUG=worker:task node worker.js
```

## Bundle size

#### Node.js build

- ESM: ~10.0 KB
- CommonJS: ~11.2 KB
- Includes: Core + Node env + inlined ms
- Excludes: Browser code

#### Browser build

- ESM: ~7.7 KB
- Includes: Core + Browser env + inlined ms
- Excludes: Node.js code, neo.colors dependency

## Performance

The repository contains reproducible benchmarks for enabled and disabled logging
paths.

See [BENCHMARKS.md](./BENCHMARKS.md) for the environment, method, results, and
limits.

Run the benchmark suite:

```bash
lpm run bench
```

Benchmark results depend on the runtime, computer, options, and input data.

## Runtime support

- **Node.js:** 18 or later
- **Browsers:** Modern browsers with `localStorage` and `%c` console formatting
- **Module formats:** ESM and CommonJS in Node.js, ESM in browsers
- **TypeScript:** Declaration files included

## License

MIT. See [LICENSE](./LICENSE).
