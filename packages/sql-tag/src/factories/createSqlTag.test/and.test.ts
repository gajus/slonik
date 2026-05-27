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
    sql: "SELECT * FROM foo WHERE bar = $slonik_1 AND baz = $slonik_2",
    type: FragmentToken,
    values: [1, 2],
  });
});

test("works with a single member", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([sql.fragment`bar IS NULL`])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE bar IS NULL",
    type: FragmentToken,
    values: [],
  });
});

test("supports primitive values", (t) => {
  const query = sql.fragment`SELECT ${sql.and([1, 2])}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1 AND $slonik_2",
    type: FragmentToken,
    values: [1, 2],
  });
});

test("filters out false members", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([false, sql.fragment`bar = ${1}`])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE bar = $slonik_1",
    type: FragmentToken,
    values: [1],
  });
});

test("filters out null members", (t) => {
  const query = sql.fragment`SELECT * FROM foo WHERE ${sql.and([null, sql.fragment`bar = ${1}`])}`;

  t.deepEqual(query, {
    sql: "SELECT * FROM foo WHERE bar = $slonik_1",
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
    sql: "SELECT * FROM foo WHERE bar = $slonik_1",
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
