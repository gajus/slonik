import test from "ava";
import { createPoolConfiguration } from "./createPoolConfiguration.js";
import { createClientConfiguration } from "./createClientConfiguration.js";

const baseUri = "postgres://user:password@localhost/db";

const makeConfig = (overrides: Record<string, unknown> = {}) =>
  createClientConfiguration(baseUri, overrides as never);

test("maximumConnectionAge=0 clamps to 1 and warns", (t) => {
  const config = makeConfig({ maximumConnectionAge: 0 });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.maximumConnectionAge, 1, "maximumConnectionAge=0 should be clamped to 1");
});

test("maximumConnectionAge positive number is passed through", (t) => {
  const config = makeConfig({ maximumConnectionAge: 5_000 });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.maximumConnectionAge, 5_000);
});

test("maximumConnectionAge DISABLE_TIMEOUT is passed through", (t) => {
  const config = makeConfig({ maximumConnectionAge: "DISABLE_TIMEOUT" });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.maximumConnectionAge, Number.POSITIVE_INFINITY);
});

test("maximumConnectionAge undefined uses default of 30 minutes", (t) => {
  const config = makeConfig();
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.maximumConnectionAge, 30 * 60 * 1_000);
});

test("idleTimeout=0 clamps to 1", (t) => {
  const config = makeConfig({ idleTimeout: 0 });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.idleTimeout, 1);
});

test("idleTimeout DISABLE_TIMEOUT is passed through", (t) => {
  const config = makeConfig({ idleTimeout: "DISABLE_TIMEOUT" });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.idleTimeout, Number.POSITIVE_INFINITY);
});

test("idleTimeout positive number is passed through", (t) => {
  const config = makeConfig({ idleTimeout: 5_000 });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.idleTimeout, 5_000);
});

test("explicit undefined for idleTimeout uses default", (t) => {
  const config = makeConfig({ idleTimeout: undefined });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.idleTimeout, 5_000);
});

test("explicit undefined for statementTimeout uses default", (t) => {
  const config = makeConfig({ statementTimeout: undefined });

  t.is(config.statementTimeout, 60_000);
});

test("explicit undefined for idleInTransactionSessionTimeout uses default", (t) => {
  const config = makeConfig({ idleInTransactionSessionTimeout: undefined });

  t.is(config.idleInTransactionSessionTimeout, 60_000);
});

test("maxPoolSize is passed through to the pool configuration", (t) => {
  const config = makeConfig({ maxPoolSize: 5 });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.maximumPoolSize, 5);
});

test("deprecated maximumPoolSize still configures the pool", (t) => {
  const config = makeConfig({ maximumPoolSize: 5 });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.maximumPoolSize, 5);
});

test("maxPoolSize takes precedence over the deprecated maximumPoolSize", (t) => {
  const config = makeConfig({ maximumPoolSize: 3, maxPoolSize: 7 });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.maximumPoolSize, 7);
});

test("minPoolSize is passed through to the pool configuration", (t) => {
  const config = makeConfig({ minPoolSize: 2 });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.minimumPoolSize, 2);
});

test("deprecated minimumPoolSize still configures the pool", (t) => {
  const config = makeConfig({ minimumPoolSize: 2 });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.minimumPoolSize, 2);
});

test("minPoolSize takes precedence over the deprecated minimumPoolSize", (t) => {
  const config = makeConfig({ minimumPoolSize: 1, minPoolSize: 4 });
  const poolConfig = createPoolConfiguration(config);

  t.is(poolConfig.minimumPoolSize, 4);
});

test("maxPoolSize must be equal to or greater than 1", (t) => {
  t.throws(() => makeConfig({ maxPoolSize: 0 }), {
    message: "maxPoolSize must be equal to or greater than 1.",
  });
});

test("maxPoolSize must be equal to or greater than minPoolSize", (t) => {
  t.throws(() => makeConfig({ maxPoolSize: 1, minPoolSize: 5 }), {
    message: "maxPoolSize must be equal to or greater than minPoolSize.",
  });
});
