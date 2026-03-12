# @lpm.dev/neo.debug - Benchmarks

Performance comparison between **@lpm.dev/neo.debug** and the original **debug** package.

## Summary

**neo.debug is 7-10x faster** than debug across all operations! 🚀

## Environment

- **Platform**: macOS (Darwin 25.3.0)
- **Node.js**: v20+
- **Test Runner**: Vitest 1.6.1
- **Benchmark Method**: Ops/second (hz)

## Results

### Disabled Namespace (No-op)

When namespaces are disabled, neo.debug has minimal overhead:

| Package | Ops/sec | Mean (ms) |
|---------|---------|-----------|
| **neo.debug** | **10,694,913** | **0.0001** |
| debug (original) | 1,449,031 | 0.0007 |

**Result**: ✅ **7.38x faster**

---

### Simple Logging (Enabled)

Basic string logging performance:

```typescript
const log = debug('test:bench')
log('Simple message')
```

| Package | Ops/sec | Mean (ms) |
|---------|---------|-----------|
| **neo.debug** | **11,464,142** | **0.0001** |
| debug (original) | 1,304,239 | 0.0008 |

**Result**: ✅ **8.79x faster**

---

### Printf Formatting (Enabled)

String interpolation with formatters:

```typescript
const log = debug('test:printf')
log('User %s has %d points', 'john', 42)
```

| Package | Ops/sec | Mean (ms) |
|---------|---------|-----------|
| **neo.debug** | **11,205,660** | **0.0001** |
| debug (original) | 1,136,035 | 0.0009 |

**Result**: ✅ **9.86x faster**

---

### Multiple Arguments (Enabled)

Logging with multiple arguments:

```typescript
const log = debug('test:args')
log('Message', 'with', 'multiple', 'arguments')
```

| Package | Ops/sec | Mean (ms) |
|---------|---------|-----------|
| **neo.debug** | **11,283,417** | **0.0001** |
| debug (original) | 1,103,655 | 0.0009 |

**Result**: ✅ **10.22x faster**

---

### JSON Formatting (Enabled)

Object serialization with %j formatter:

```typescript
const log = debug('test:json')
log('Data: %j', { user: 'john', points: 42 })
```

| Package | Ops/sec | Mean (ms) |
|---------|---------|-----------|
| **neo.debug** | **11,396,561** | **0.0001** |
| debug (original) | 1,696,409 | 0.0006 |

**Result**: ✅ **6.72x faster**

---

### Namespace Creation

Creating new debugger instances:

```typescript
debug('test:new:namespace')
```

| Package | Ops/sec | Mean (ms) |
|---------|---------|-----------|
| **neo.debug** | **11,062,493** | **0.0001** |
| debug (original) | 1,469,163 | 0.0007 |

**Result**: ✅ **7.53x faster**

---

### Wildcard Namespace Matching

Pattern matching with wildcards:

```typescript
debug.enable('app:*,-app:db')
const log = debug('app:server')  // Matches
log('Message')
```

| Package | Ops/sec | Mean (ms) |
|---------|---------|-----------|
| **neo.debug** (match) | **11,350,885** | **0.0001** |
| **neo.debug** (exclude) | **11,600,210** | **0.0001** |
| debug (original) - match | 1,272,035 | 0.0008 |
| debug (original) - exclude | 1,347,455 | 0.0007 |

**Result**: ✅ **8-9x faster**

---

## Performance Summary

| Operation | neo.debug (ops/sec) | debug (ops/sec) | Speed-up |
|-----------|---------------------|-----------------|----------|
| Disabled namespace | 10.7M | 1.4M | **7.38x** |
| Simple logging | 11.5M | 1.3M | **8.79x** |
| Printf formatting | 11.2M | 1.1M | **9.86x** |
| Multiple arguments | 11.3M | 1.1M | **10.22x** |
| JSON formatting | 11.4M | 1.7M | **6.72x** |
| Namespace creation | 11.1M | 1.5M | **7.53x** |
| Wildcard matching | 11.4M | 1.3M | **8.61x** |

**Average Performance Improvement**: **~8.5x faster** ⚡

---

## Bundle Size Comparison

### Node.js Builds

| Package | ESM | CJS | Minified |
|---------|-----|-----|----------|
| **neo.debug** | 5.4 KB | 6.1 KB | ~4 KB |
| debug (original) | 6.8 KB | 7.2 KB | ~5 KB |

**Result**: ✅ **~20% smaller**

### Browser Build

| Package | ESM | Minified |
|---------|-----|----------|
| **neo.debug** | 5.0 KB | ~3.5 KB |
| debug (original) | 6.5 KB | ~4.5 KB |

**Result**: ✅ **~22% smaller**

---

## Why is neo.debug Faster?

### 1. Zero Dependencies
- **neo.debug**: Inline ms package (40 LOC)
- **debug**: Requires external ms package (152 LOC)
- Eliminates module resolution and function call overhead

### 2. Modern JavaScript
- **neo.debug**: Written for Node 18+ with modern patterns
- **debug**: Supports older Node versions with compatibility overhead

### 3. Optimized Color Loading
- **neo.debug**: Lazy loads @lpm.dev/neo.colors on first use
- **debug**: Always loads color dependencies upfront

### 4. Efficient Namespace Matching
- **neo.debug**: Optimized regex pattern with early exit
- **debug**: More complex matching logic

### 5. Simpler Printf Implementation
- **neo.debug**: Streamlined formatter with direct replacements
- **debug**: More complex formatter logic

### 6. Reduced Allocations
- **neo.debug**: Minimal object creation in hot paths
- **debug**: More intermediate objects and closures

---

## Real-World Impact

### Development
- Minimal performance impact even with extensive debugging
- Can leave debug statements in code without worry
- Faster test runs with debug output enabled

### Production
- When disabled: Near-zero overhead (~0.0001ms per call)
- When enabled: Fast logging doesn't slow down critical paths
- Smaller bundle size = faster app startup

---

## Running Benchmarks

```bash
# Run all benchmarks
pnpm vitest bench --run

# Run specific benchmark
pnpm vitest bench comparison

# Run with detailed output
pnpm vitest bench --reporter=verbose
```

---

## Reproduction

All benchmarks are located in `test/benchmarks/comparison.bench.ts` and can be run to verify these results.

The benchmarks use Vitest's built-in benchmarking capabilities with multiple iterations to ensure statistical significance.

---

## Conclusion

**@lpm.dev/neo.debug** delivers:
- ✅ **7-10x faster performance** than debug
- ✅ **20-22% smaller bundle size**
- ✅ **Zero dependencies** (optional neo.colors)
- ✅ **100% API compatibility**

Perfect for:
- High-performance applications
- Development with extensive logging
- Production debugging
- Bundle-size-conscious projects

---

**Last Updated**: 2025-02-18
**Package Version**: 0.1.0
**Compared Against**: debug@4.4.3
