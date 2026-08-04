# @lpm.dev/neo.debug benchmarks

The benchmark suite compares `@lpm.dev/neo.debug` with `debug@4.4.3`. Factory construction and steady-state logger calls are measured separately so constructor cost cannot hide disabled-call overhead.

## Latest sample

Measured on macOS with Node.js 22.22.3 and Vitest 3.2.7. Results vary by machine; use the command below for local numbers.

| Operation | neo.debug | debug | Relative throughput |
| --- | ---: | ---: | ---: |
| Create debugger | 5.47M ops/s | 0.74M ops/s | 7.37× |
| Call disabled debugger | 40.88M ops/s | 29.17M ops/s | 1.40× |
| Log simple message | 8.05M ops/s | 1.82M ops/s | 4.42× |
| Log printf message | 3.50M ops/s | 1.14M ops/s | 3.07× |
| Log JSON value | 3.51M ops/s | 1.24M ops/s | 2.82× |
| Log through wildcard match | 8.24M ops/s | 1.87M ops/s | 4.40× |
| Call wildcard-excluded debugger | 39.20M ops/s | 29.22M ops/s | 1.34× |

Output writes are redirected during enabled benchmarks, so these numbers compare formatting and dispatch overhead rather than terminal speed.

## Methodology

- Debugger instances are created before steady-state call measurements.
- Module initialization and optional-color resolution happen outside benchmark loops.
- Both packages receive the same enabled and excluded namespace patterns.
- Construction has its own benchmark group.
- Enabled simple, printf, and JSON workloads are reported separately.
- Vitest performs warmup and statistical sampling for every case.

Run the pinned benchmark suite with:

```bash
lpm run bench
```

The source is in `test/benchmarks/comparison.bench.ts`. Treat checked-in results as a reference sample, not a guarantee for every runtime or machine.
