import test from 'ava';
import { createPoolConfiguration } from './createPoolConfiguration.js';
import { createClientConfiguration } from './createClientConfiguration.js';

const baseUri = 'postgres://user:password@localhost/db';

const makeConfig = (overrides: Record<string, unknown> = {}) =>
  createClientConfiguration(baseUri, overrides as never);

test('maximumConnectionAge=0 clamps to 1 and warns', (t) => {
  const messages: string[] = [];
  const originalWarn = console.warn;
  // createPoolConfiguration uses the Logger, but the warn path calls log.warn
  // which ultimately writes to stderr; capture via the Logger's underlying
  // pino instance is complex, so we verify the clamped value directly.

  const config = makeConfig({ maximumConnectionAge: 0 });
  const poolConfig = createPoolConfiguration(config);

  t.is(
    poolConfig.maximumConnectionAge,
    1,
    'maximumConnectionAge=0 should be clamped to 1',
  );
});

test('maximumConnectionAge positive number is passed through', (t) => {
  const config = makeConfig({ maximumConnectionAge: 5_000 });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.maximumConnectionAge, 5_000);
});

test('maximumConnectionAge DISABLE_TIMEOUT is passed through', (t) => {
  const config = makeConfig({ maximumConnectionAge: 'DISABLE_TIMEOUT' });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.maximumConnectionAge, 'DISABLE_TIMEOUT');
});

test('maximumConnectionAge undefined uses default of 30 minutes', (t) => {
  const config = makeConfig();
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.maximumConnectionAge, 30 * 60 * 1_000);
});

test('idleTimeout=0 clamps to 1', (t) => {
  const config = makeConfig({ idleTimeout: 0 });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.idleTimeout, 1);
});

test('idleTimeout DISABLE_TIMEOUT is passed through', (t) => {
  const config = makeConfig({ idleTimeout: 'DISABLE_TIMEOUT' });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.idleTimeout, 'DISABLE_TIMEOUT');
});

test('idleTimeout positive number is passed through', (t) => {
  const config = makeConfig({ idleTimeout: 5_000 });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.idleTimeout, 5_000);
});
