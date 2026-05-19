import { FragmentToken } from "../../tokens.js";
import { createSqlTag } from "../createSqlTag.js";
import test from "ava";

const sql = createSqlTag();

test("binds a timestamp", (t) => {
  const query = sql.fragment`SELECT ${sql.timestamp(new Date("2022-08-19T03:27:24.951Z"))}`;

  t.deepEqual(query, {
    sql: "SELECT to_timestamp($slonik_1)",
    type: FragmentToken,
    values: ["1660879644.951"],
  });
});

test("binds a Temporal.Instant-like object", (t) => {
  const epochMilliseconds = new Date("2022-08-19T03:27:24.951Z").getTime();
  const query = sql.fragment`SELECT ${sql.timestamp({ epochMilliseconds })}`;

  t.deepEqual(query, {
    sql: "SELECT to_timestamp($slonik_1)",
    type: FragmentToken,
    values: ["1660879644.951"],
  });
});

test("throws if not a Date or Temporal.Instant", (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${sql.timestamp(1)}`;
  });

  t.is(
    error?.message,
    "Timestamp parameter value must be an instance of Date or a Temporal.Instant/ZonedDateTime.",
  );
});
