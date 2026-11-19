import { createClientConfiguration } from "./createClientConfiguration.js";
import { InvalidConfigurationError } from "@slonik/errors";
import test from "ava";

const baseUri = "postgres://user:password@localhost/db";

const makeConfig = (overrides: Record<string, unknown> = {}) =>
  createClientConfiguration(baseUri, overrides as never);

test("foreignConnections defaults to reject", (t) => {
  t.is(makeConfig().foreignConnections, "reject");
});

test("foreignConnections is passed through", (t) => {
  t.is(makeConfig({ foreignConnections: "allow" }).foreignConnections, "allow");
  t.is(makeConfig({ foreignConnections: "reject" }).foreignConnections, "reject");
});

test("dangerouslyAllowForeignConnections (deprecated) maps to foreignConnections", (t) => {
  t.is(makeConfig({ dangerouslyAllowForeignConnections: true }).foreignConnections, "allow");
  t.is(makeConfig({ dangerouslyAllowForeignConnections: false }).foreignConnections, "reject");
});

test("foreignConnections takes precedence over dangerouslyAllowForeignConnections", (t) => {
  t.is(
    makeConfig({ dangerouslyAllowForeignConnections: true, foreignConnections: "reject" })
      .foreignConnections,
    "reject",
  );
  t.is(
    makeConfig({ dangerouslyAllowForeignConnections: false, foreignConnections: "allow" })
      .foreignConnections,
    "allow",
  );
});

test("throws InvalidConfigurationError for an unknown foreignConnections value", (t) => {
  const error = t.throws(() => makeConfig({ foreignConnections: "join" }));

  t.true(error instanceof InvalidConfigurationError);
  t.is(error?.message, 'foreignConnections must be "allow" or "reject".');
});

test("accepts queueTimeout values that setTimeout supports", (t) => {
  for (const queueTimeout of [undefined, "DISABLE_TIMEOUT", 0, 1, 5_000, 2_147_483_647]) {
    t.notThrows(() => makeConfig({ queueTimeout }), String(queueTimeout));
  }
});

test("throws InvalidConfigurationError for a queueTimeout value that setTimeout does not support", (t) => {
  for (const queueTimeout of [
    -1,
    2_147_483_648,
    Number.POSITIVE_INFINITY,
    Number.NaN,
    "5000",
    null,
  ]) {
    const error = t.throws(() => makeConfig({ queueTimeout }), undefined, String(queueTimeout));

    t.true(error instanceof InvalidConfigurationError);
    t.is(
      error?.message,
      'queueTimeout must be "DISABLE_TIMEOUT" or a number between 0 and 2147483647.',
    );
  }
});
