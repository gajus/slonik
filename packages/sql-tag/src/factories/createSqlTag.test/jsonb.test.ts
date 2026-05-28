import { FragmentToken } from "../../tokens.js";
import { createSqlTag } from "../createSqlTag.js";
import test from "ava";

const sql = createSqlTag();

test("creates a value list (object)", (t) => {
  const query = sql.fragment`SELECT ${sql.jsonb({
    foo: "bar",
  })}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1::jsonb",
    type: FragmentToken,
    values: ['{"foo":"bar"}'],
  });
});

test("creates a value list (array)", (t) => {
  const query = sql.fragment`SELECT ${sql.jsonb([
    {
      foo: "bar",
    },
  ])}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1::jsonb",
    type: FragmentToken,
    values: ['[{"foo":"bar"}]'],
  });
});

test("stringifies NULL to 'null'::jsonb", (t) => {
  const query = sql.fragment`SELECT ${sql.jsonb(null)}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1::jsonb",
    type: FragmentToken,
    values: ["null"],
  });
});

test("JSON encodes string values", (t) => {
  const query = sql.fragment`SELECT ${sql.jsonb("example string")}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1::jsonb",
    type: FragmentToken,
    values: ['"example string"'],
  });
});

test("JSON encodes numeric values", (t) => {
  const query = sql.fragment`SELECT ${sql.jsonb(1_234)}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1::jsonb",
    type: FragmentToken,
    values: ["1234"],
  });
});

test("JSON encodes boolean values", (t) => {
  const query = sql.fragment`SELECT ${sql.jsonb(true)}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1::jsonb",
    type: FragmentToken,
    values: ["true"],
  });
});

test("throws if payload is undefined", (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional: undefined is rejected at compile time and at runtime
    sql.fragment`SELECT ${sql.jsonb(undefined)}`;
  });

  t.is(error?.message, "JSON payload must not be undefined.");
});

test("throws if payload cannot be stringified (non-primitive object)", (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT ${sql.jsonb(() => {})}`;
  });

  t.is(error?.message, "JSON payload must be a primitive value or a plain object.");
});

test("Object types with optional properties are allowed", (t) => {
  type TypeWithOptionalProperty = { foo: string; opt?: string };
  const testValue: TypeWithOptionalProperty = {
    foo: "bar",
  };

  const query = sql.fragment`SELECT ${sql.jsonb(testValue)}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1::jsonb",
    type: FragmentToken,
    values: ['{"foo":"bar"}'],
  });
});

test("accepts Record<string, unknown> payloads", (t) => {
  const payload: Record<string, unknown> = {
    foo: "bar",
    nested: { count: 1 },
  };

  const query = sql.fragment`SELECT ${sql.jsonb(payload)}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1::jsonb",
    type: FragmentToken,
    values: ['{"foo":"bar","nested":{"count":1}}'],
  });
});

test("accepts object-typed payloads", (t) => {
  const payload: object = { foo: "bar" };

  const query = sql.fragment`SELECT ${sql.jsonb(payload)}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1::jsonb",
    type: FragmentToken,
    values: ['{"foo":"bar"}'],
  });
});

test("accepts interface-typed payloads without an index signature", (t) => {
  type Payload = { meta: Record<string, unknown>; name: string };
  const payload: Payload = { meta: { count: 1 }, name: "x" };

  const query = sql.fragment`SELECT ${sql.jsonb(payload)}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1::jsonb",
    type: FragmentToken,
    values: ['{"meta":{"count":1},"name":"x"}'],
  });
});

test("throws when payload contains a null byte at the top level", (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT ${sql.jsonb("hello\u0000world")}`;
  });

  t.regex(error?.message ?? "", /null byte/);
  t.regex(error?.message ?? "", /\$/);
});

test("throws when payload contains a null byte inside an object", (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT ${sql.jsonb({ outer: { inner: "bad\u0000value" } })}`;
  });

  t.regex(error?.message ?? "", /null byte/);
  t.regex(error?.message ?? "", /\$\.outer\.inner/);
});

test("throws when payload contains a null byte inside an array", (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT ${sql.jsonb(["ok", "bad\u0000"])}`;
  });

  t.regex(error?.message ?? "", /null byte/);
  t.regex(error?.message ?? "", /\$\[1\]/);
});

test("throws when payload contains a lone high surrogate", (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT ${sql.jsonb({ s: "\uD800x" })}`;
  });

  t.regex(error?.message ?? "", /surrogate/);
});

test("throws when payload contains a lone low surrogate", (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT ${sql.jsonb({ s: "x\uDC00" })}`;
  });

  t.regex(error?.message ?? "", /surrogate/);
});

test("accepts valid surrogate pairs (e.g. emoji)", (t) => {
  const query = sql.fragment`SELECT ${sql.jsonb({ s: "hi 😀" })}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1::jsonb",
    type: FragmentToken,
    values: ['{"s":"hi 😀"}'],
  });
});
