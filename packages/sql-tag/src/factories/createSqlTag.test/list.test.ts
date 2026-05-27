import { FragmentToken } from "../../tokens.js";
import { createSqlTag } from "../createSqlTag.js";
import test from "ava";

const sql = createSqlTag();

test("joins values with commas", (t) => {
  const query = sql.fragment`SELECT ${sql.list([1, 2, 3])}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1, $slonik_2, $slonik_3",
    type: FragmentToken,
    values: [1, 2, 3],
  });
});

test("joins fragments with commas", (t) => {
  const query = sql.fragment`ORDER BY ${sql.list([
    sql.fragment`created_at DESC`,
    sql.fragment`id ASC`,
  ])}`;

  t.deepEqual(query, {
    sql: "ORDER BY created_at DESC, id ASC",
    type: FragmentToken,
    values: [],
  });
});

test("works with a single member", (t) => {
  const query = sql.fragment`SELECT ${sql.list([sql.fragment`foo`])}`;

  t.deepEqual(query, {
    sql: "SELECT foo",
    type: FragmentToken,
    values: [],
  });
});

test("mixes fragments and primitives", (t) => {
  const query = sql.fragment`SELECT ${sql.list([1, sql.fragment`now()`, 3])}`;

  t.deepEqual(query, {
    sql: "SELECT $slonik_1, now(), $slonik_2",
    type: FragmentToken,
    values: [1, 3],
  });
});
