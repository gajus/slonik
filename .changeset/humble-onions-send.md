---
"@slonik/driver": minor
"slonik": minor
---

Add `'DISABLE_TIMEOUT'` support for `idleTimeout` and `maximumConnectionAge`.

Previously, passing `idleTimeout: 'DISABLE_TIMEOUT'` was silently ignored — the sentinel string was accepted by the type but never propagated through `createPoolConfiguration`, so the idle timer always fired at the default 10s. Similarly, `maximumConnectionAge` only accepted a plain number with no way to opt out of age-based connection recycling.

**Changes:**

- `idleTimeout: 'DISABLE_TIMEOUT'` now correctly disables idle connection cleanup. Connections above `minimumPoolSize` are kept alive indefinitely until explicitly released or the pool is ended.
- `maximumConnectionAge` now accepts `'DISABLE_TIMEOUT'` to disable age-based recycling. Connections are no longer destroyed and replaced after the default 30-minute lifetime.
- Passing `0` for either field now emits a warning and clamps to `1ms` (matching the existing `idleTimeout=0` behaviour), rather than being silently ignored.
- `DriverConfiguration.maximumConnectionAge` in `@slonik/driver` is widened to `'DISABLE_TIMEOUT' | number` for consistency with the other timeout fields.

Internally, `'DISABLE_TIMEOUT'` is resolved to `Number.POSITIVE_INFINITY` at the `createPoolConfiguration` boundary so that `createConnectionPool` works with plain numeric comparisons throughout.
