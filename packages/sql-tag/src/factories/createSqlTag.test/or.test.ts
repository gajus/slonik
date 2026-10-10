import { FragmentToken } from "../../tokens.js";
import { createSqlTag } from "../createSqlTag.js";
import test from "ava";

const sql = createSqlTag();

test("combines fragments with OR", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.or([
    sql.fragment`bar = ${1}`,
    sql.fragment`baz = ${2}`,
  ])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE ((bar = $slonik_1) OR (baz = $slonik_2))",
    type: FragmentToken,
    values: [1, 2],
  });
});

test("works with a single member", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.or([sql.fragment`bar IS NULL`])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE (bar IS NULL)",
    type: FragmentToken,
    values: [],
  });
});

test("supports primitive values", (t) => {
  const query = sql.fragment`SELECT ${sql.or([1, 2])}`;

  t.deepEqual(query, {
    sql: "SELECT ($slonik_1 OR $slonik_2)",
    type: FragmentToken,
    values: [1, 2],
  });
});

test("nests sql.and without parenthesizing it again", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.or([
    sql.and([sql.fragment`bar = ${1}`, sql.fragment`baz = ${2}`]),
    sql.fragment`qux = ${3}`,
  ])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE (((bar = $slonik_1) AND (baz = $slonik_2)) OR (qux = $slonik_3))",
    type: FragmentToken,
    values: [1, 2, 3],
  });
});

test("keeps its meaning when embedded next to other operators", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE tenant_id = ${1} AND ${sql.or([
    sql.fragment`bar = ${2}`,
    sql.fragment`baz = ${3}`,
  ])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE tenant_id = $slonik_1 AND ((bar = $slonik_2) OR (baz = $slonik_3))",
    type: FragmentToken,
    values: [1, 2, 3],
  });
});

test("filters out false, null, and undefined members", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.or([
    false,
    null,
    undefined,
    sql.fragment`bar = ${1}`,
  ])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE (bar = $slonik_1)",
    type: FragmentToken,
    values: [1],
  });
});

test("returns FALSE when all members are filtered out", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.or([false, null, undefined])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE FALSE",
    type: FragmentToken,
    values: [],
  });
});

test("returns FALSE for empty array", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.or([])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE FALSE",
    type: FragmentToken,
    values: [],
  });
});
