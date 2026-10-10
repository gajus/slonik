import { FragmentToken } from "../../tokens.js";
import { createSqlTag } from "../createSqlTag.js";
import test from "ava";

const sql = createSqlTag();

test("combines fragments with AND", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([
    sql.fragment`bar = ${1}`,
    sql.fragment`baz = ${2}`,
  ])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE ((bar = $slonik_1) AND (baz = $slonik_2))",
    type: FragmentToken,
    values: [1, 2],
  });
});

test("works with a single member", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([sql.fragment`bar IS NULL`])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE (bar IS NULL)",
    type: FragmentToken,
    values: [],
  });
});

test("supports primitive values", (t) => {
  const query = sql.fragment`SELECT ${sql.and([1, 2])}`;

  t.deepEqual(query, {
    sql: "SELECT ($slonik_1 AND $slonik_2)",
    type: FragmentToken,
    values: [1, 2],
  });
});

test("does not parenthesize identifiers", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([
    sql.identifier(["is_active"]),
    sql.identifier(["is_verified"]),
  ])}`;

  t.deepEqual(query, {
    sql: 'SELECT * FROM foo WHERE ("is_active" AND "is_verified")',
    type: FragmentToken,
    values: [],
  });
});

test("parenthesizes members that contain other operators", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([
    sql.fragment`tenant_id = ${1}`,
    sql.fragment`name = ${"foo"} OR email = ${"foo"}`,
  ])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE ((tenant_id = $slonik_1) AND (name = $slonik_2 OR email = $slonik_3))",
    type: FragmentToken,
    values: [1, "foo", "foo"],
  });
});

test("parenthesizes sql.join members", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([
    sql.fragment`tenant_id = ${1}`,
    sql.join([sql.fragment`bar = ${2}`, sql.fragment`baz = ${3}`], sql.fragment` OR `),
  ])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE ((tenant_id = $slonik_1) AND (bar = $slonik_2 OR baz = $slonik_3))",
    type: FragmentToken,
    values: [1, 2, 3],
  });
});

test("nests sql.or without parenthesizing it again", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([
    sql.or([sql.fragment`status = ${"open"}`, sql.fragment`status = ${"pending"}`]),
    sql.fragment`owner_id = ${1}`,
  ])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE (((status = $slonik_1) OR (status = $slonik_2)) AND (owner_id = $slonik_3))",
    type: FragmentToken,
    values: ["open", "pending", 1],
  });
});

test("keeps its meaning when embedded next to other operators", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE NOT ${sql.and([
    sql.fragment`bar = ${1}`,
    sql.fragment`baz = ${2}`,
  ])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE NOT ((bar = $slonik_1) AND (baz = $slonik_2))",
    type: FragmentToken,
    values: [1, 2],
  });
});

test("offsets placeholders of nested members", (t) => {
  const query = sql.fragment`SELECT ${1} FROM foo WHERE ${sql.and([
    sql.fragment`bar = ${2}`,
    sql.or([sql.fragment`baz = ${3}`, sql.fragment`qux = ${4}`]),
  ])}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1 FROM foo WHERE ((bar = $slonik_2) AND ((baz = $slonik_3) OR (qux = $slonik_4)))",
    type: FragmentToken,
    values: [1, 2, 3, 4],
  });
});

test("filters out false members", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([false, sql.fragment`bar = ${1}`])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE (bar = $slonik_1)",
    type: FragmentToken,
    values: [1],
  });
});

test("filters out null members", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([null, sql.fragment`bar = ${1}`])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE (bar = $slonik_1)",
    type: FragmentToken,
    values: [1],
  });
});

test("filters out undefined members", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([
    undefined,
    sql.fragment`bar = ${1}`,
  ])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE (bar = $slonik_1)",
    type: FragmentToken,
    values: [1],
  });
});

test("returns TRUE when all members are filtered out", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([false, null, undefined])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE TRUE",
    type: FragmentToken,
    values: [],
  });
});

test("returns TRUE for empty array", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE TRUE",
    type: FragmentToken,
    values: [],
  });
});
