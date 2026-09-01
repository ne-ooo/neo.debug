# @lpm.dev/neo.debug - Future Enhancements

## Potential Features & Improvements

### 1. Custom Formatters
**Status**: Not implemented
**Priority**: Medium
**Effort**: Low

Allow users to register custom formatters:
```typescript
import debug from '@lpm.dev/neo.debug'

debug.formatters.h = (value) => {
  return require('util').inspect(value, { colors: true })
}

const log = debug('app')
log('data: %h', complexObject)
```

**Benefits**:
- Extensibility for specific use cases
- Custom formatting for domain objects
- Better developer experience

**Considerations**:
- ~30 LOC addition
- Need to ensure formatters are environment-safe
- Documentation overhead

---

### 2. Async/Await Support
**Status**: Not implemented
**Priority**: Low
**Effort**: Low

Support for async logging (useful for remote logging):
```typescript
const log = debug('app', {
  async: true,
  transport: async (msg) => {
    await sendToRemoteLogger(msg)
  }
})
```

**Benefits**:
- Remote logging support
- Async transports (file, network)
- Integration with APM tools

**Considerations**:
- ~50 LOC addition
- May introduce performance overhead
- Need to handle backpressure

---

### 3. Log Levels
**Status**: Not implemented
**Priority**: Medium
**Effort**: Medium

Add log levels like debug, info, warn, error:
```typescript
import { createLogger } from '@lpm.dev/neo.debug'

const log = createLogger('app')

log.debug('Debug message')
log.info('Info message')
log.warn('Warning message')
log.error('Error message')

// Control via DEBUG_LEVEL
// DEBUG_LEVEL=warn only shows warn and error
```

**Benefits**:
- Better log organization
- Production-friendly (hide debug in prod)
- Industry standard pattern

**Considerations**:
- ~100 LOC addition
- May conflict with debug philosophy (namespaces over levels)
- Need to decide on level hierarchy
- Alternative: Users can use multiple namespaces (app:debug, app:error)

---

### 4. Structured Logging
**Status**: Not implemented
**Priority**: High
**Effort**: Medium

Output logs in structured format (JSON):
```typescript
const log = debug('app', { format: 'json' })

log('User logged in', { userId: 123, ip: '1.2.3.4' })
// {"timestamp":"2025-01-15T10:30:00.000Z","namespace":"app","message":"User logged in","userId":123,"ip":"1.2.3.4"}
```

**Benefits**:
- Machine-parseable logs
- Better for log aggregation (ELK, Datadog)
- Cloud-native logging

**Considerations**:
- ~80 LOC addition
- Need to ensure JSON is valid
- May want different JSON schemas
- Performance impact of JSON.stringify

---

### 5. File Output
**Status**: Not implemented
**Priority**: Low
**Effort**: Medium

Write logs to files (Node.js only):
```typescript
import debug from '@lpm.dev/neo.debug'

debug.configure({
  output: './logs/debug.log',
  rotate: true,
  maxSize: '10MB'
})
```

**Benefits**:
- Persistent logs
- Production debugging
- Audit trails

**Considerations**:
- ~150 LOC addition
- File system operations (async, errors)
- Log rotation complexity
- Better handled by external tools (logrotate, winston)

---

### 6. Custom Colors
**Status**: Not implemented
**Priority**: Low
**Effort**: Low

Allow users to customize colors:
```typescript
const log = debug('app', {
  color: '#ff6b6b'  // Custom color
})

// Or globally
debug.colors = ['#ff0000', '#00ff00', '#0000ff']
```

**Benefits**:
- Brand consistency
- Accessibility (color blind friendly)
- User preferences

**Considerations**:
- ~40 LOC addition
- May conflict with automatic color assignment
- Browser vs Node color formats differ

---

### 7. Middleware/Plugins
**Status**: Not implemented
**Priority**: Medium
**Effort**: High

Plugin system for extensibility:
```typescript
const log = debug('app')

log.use({
  name: 'timestamp',
  transform: (message) => {
    return `[${new Date().toISOString()}] ${message}`
  }
})

log.use({
  name: 'redact',
  transform: (message) => {
    return message.replace(/password=\w+/g, 'password=***')
  }
})
```

**Benefits**:
- Extensibility without bloating core
- Community plugins
- Custom transformations

**Considerations**:
- ~150-200 LOC addition
- Need stable plugin API
- Performance impact of middleware chain
- May conflict with simplicity philosophy

---

### 8. Performance Metrics
**Status**: Not implemented
**Priority**: Low
**Effort**: Low

Track logging performance:
```typescript
const log = debug('app', { metrics: true })

// After some time
console.log(log.metrics())
// { callCount: 1000, totalTime: 50, avgTime: 0.05 }
```

**Benefits**:
- Identify logging bottlenecks
- Performance monitoring
- Optimization insights

**Considerations**:
- ~50 LOC addition
- Minimal overhead
- Mostly useful for library authors

---

### 9. Context Preservation
**Status**: Not implemented
**Priority**: Medium
**Effort**: Medium

Preserve context across async operations:
```typescript
import debug from '@lpm.dev/neo.debug'

const log = debug('app')

async function handleRequest(req) {
  const ctx = log.context({ requestId: req.id })

  await doSomething()
  ctx.log('Step 1')  // Includes requestId

  await doSomethingElse()
  ctx.log('Step 2')  // Includes requestId
}
```

**Benefits**:
- Better async debugging
- Request tracing
- Correlation IDs

**Considerations**:
- ~100 LOC addition
- Needs AsyncLocalStorage (Node 12+)
- Browser support unclear
- May overlap with APM tools

---

### 10. TypeScript Strict Template Literals
**Status**: Not implemented
**Priority**: Low
**Effort**: Low

Type-safe printf formatting:
```typescript
const log = debug<['user %s has %d points']>('app')

log('user %s has %d points', 'john', 42)  // ✓ OK
log('user %s has %d points', 'john')      // ✗ Type error
log('user %s has %d points', 42, 'john')  // ✗ Type error
```

**Benefits**:
- Compile-time format string validation
- Better developer experience
- Fewer runtime errors

**Considerations**:
- ~50 LOC TypeScript types
- Only benefits TypeScript users
- Complex type inference
- May be overkill for debug logging

---

### 11. Conditional Breakpoints
**Status**: Not implemented
**Priority**: Low
**Effort**: Low

Trigger debugger on specific conditions:
```typescript
const log = debug('app', {
  breakOn: (msg) => msg.includes('error')
})

log('all good')    // Normal log
log('error here')  // Triggers debugger
```

**Benefits**:
- Debugging convenience
- Conditional debugging
- Development productivity

**Considerations**:
- ~30 LOC addition
- Only useful in development
- Browser debugger API differs from Node

---

### 12. Integration with OpenTelemetry
**Status**: Not implemented
**Priority**: Low
**Effort**: High

Export logs to OpenTelemetry:
```typescript
import debug from '@lpm.dev/neo.debug'
import { trace } from '@opentelemetry/api'

const log = debug('app', {
  opentelemetry: true
})

log('User action')  // Also sent to OpenTelemetry
```

**Benefits**:
- Distributed tracing
- Modern observability
- Cloud-native integration

**Considerations**:
- ~200 LOC addition
- Adds dependency on @opentelemetry/api
- Scope creep (observability vs debugging)
- Better as separate integration package

---

### 13. Browser DevTools Integration
**Status**: Not implemented
**Priority**: Low
**Effort**: Medium

Better integration with browser DevTools:
```typescript
// Automatic source maps
// Click on log → jumps to source code location

// Console groups
log.group('User flow')
log('Step 1')
log('Step 2')
log.groupEnd()
```

**Benefits**:
- Better debugging experience
- Source map support
- Console organization

**Considerations**:
- ~80 LOC addition
- Browser-specific
- DevTools API may change
- Some features already work automatically

---

## Recommended Priority Order

### High Priority (Consider for v0.2.0)
1. **Structured Logging** - JSON output for production
2. **Custom Formatters** - Extensibility without bloat

### Medium Priority (Consider for v1.x)
3. **Log Levels** - debug/info/warn/error hierarchy
4. **Middleware/Plugins** - Extensibility for power users
5. **Context Preservation** - AsyncLocalStorage for request tracing
6. **Custom Colors** - Accessibility and branding

### Low Priority (Consider if requested)
7. Performance Metrics
8. TypeScript Strict Template Literals
9. Async/Await Support
10. Conditional Breakpoints
11. Browser DevTools Integration

### Not Recommended
- **File Output** - Use external tools (winston, pino)
- **OpenTelemetry Integration** - Better as separate package

---

## Integration Opportunities

### With Neo.colors
- Already integrated for Node.js terminal colors
- Share color palette
- Unified theming

### With Future Neo packages
- **neo.logger** - Full-featured logging library
- **neo.trace** - Distributed tracing
- **neo.metrics** - Metrics collection
- **neo.config** - Configuration management

---

## Community Feedback

Track feature requests:
- GitHub Issues: User requests
- npm trends: Compare with debug, pino, winston
- Real-world usage: Monitor how people use neo.debug

---

## Breaking Changes for v2.0

Future breaking changes to consider:
- Require Node 20+
- Remove deprecated APIs
- Simplify namespace matching
- Merge with logging package
- Native ESM only (drop CJS)

---

**Last Updated**: 2026-08-31
**Package Version**: 1.0.0
