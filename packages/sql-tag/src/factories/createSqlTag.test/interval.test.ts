import { FragmentToken } from "../../tokens.js";
import { createSqlTag } from "../createSqlTag.js";
import test from "ava";

const sql = createSqlTag();

test("creates an empty make_interval invocation", (t) => {
  const query = sql.fragment`SELECT ${sql.interval({})}`;

  t.deepEqual(query, {
    sql: "SELECT make_interval()",
    type: FragmentToken,
    values: [],
  });
});

test("creates an interval", (t) => {
  const query = sql.fragment`SELECT ${sql.interval({
    days: 4,
    hours: 5,
    minutes: 6,
    months: 2,
    seconds: 7,
    weeks: 3,
    years: 1,
  })}`;

  t.deepEqual(query, {
    sql: "SELECT make_interval(years => $slonik_1, months => $slonik_2, weeks => $slonik_3, days => $slonik_4, hours => $slonik_5, mins => $slonik_6, secs => $slonik_7)",
    type: FragmentToken,
    values: [1, 2, 3, 4, 5, 6, 7],
  });
});

test("creates an interval from a Temporal.Duration-like object", (t) => {
  const query = sql.fragment`SELECT ${sql.interval({
    days: 4,
    hours: 5,
    microseconds: 0,
    milliseconds: 0,
    minutes: 6,
    months: 2,
    nanoseconds: 0,
    seconds: 7,
    weeks: 3,
    years: 1,
  } as Parameters<typeof sql.interval>[0])}`;

  t.deepEqual(query, {
    sql: "SELECT make_interval(years => $slonik_1, months => $slonik_2, weeks => $slonik_3, days => $slonik_4, hours => $slonik_5, mins => $slonik_6, secs => $slonik_7)",
    type: FragmentToken,
    values: [1, 2, 3, 4, 5, 6, 7],
  });
});

test("creates an interval from a Temporal.Duration-like object with zero values omitted", (t) => {
  const query = sql.fragment`SELECT ${sql.interval({
    days: 0,
    hours: 0,
    microseconds: 0,
    milliseconds: 0,
    minutes: 0,
    months: 0,
    nanoseconds: 0,
    seconds: 0,
    weeks: 0,
    years: 1,
  } as Parameters<typeof sql.interval>[0])}`;

  t.deepEqual(query, {
    sql: "SELECT make_interval(years => $slonik_1)",
    type: FragmentToken,
    values: [1],
  });
});

test("throws if contains unknown properties", (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT ${sql.interval({
      // @ts-expect-error - intentional
      foo: "bar",
    })}`;
  });

  t.is(
    error?.message,
    "Interval input must be a valid IntervalInput object or a Temporal.Duration.",
  );
});
