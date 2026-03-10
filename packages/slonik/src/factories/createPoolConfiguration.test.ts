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
