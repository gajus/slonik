import { createPool } from "../factories/createPool.js";
import { createTestRunner } from "../helpers.test/createTestRunner.js";
import { DataIntegrityError } from "@slonik/errors";
import { createPgDriverFactory } from "@slonik/pg-driver";
import { createSqlTag } from "@slonik/sql-tag";
import { z } from "zod";

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, "pg");

const sql = createSqlTag();

test("returns empty object if no rows are returned", async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const result = await pool.record(sql.type(
    z.object({
      key: z.number(),
      value: z.number(),
    }),
  )`
    SELECT *
    FROM (VALUES (1, 2)) as t(key, value)
    WHERE false
  `);

  t.deepEqual(result, {});
});

test("returns a record built from the key and value columns", async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const result = await pool.record(sql.type(
    z.object({
      key: z.number(),
      value: z.number(),
    }),
  )`
    SELECT *
    FROM (VALUES (1, 2), (3, 4)) as t(key, value)
  `);

  t.deepEqual(result, {
    1: 2,
    3: 4,
  });
});

test("returns a record built from string keys", async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const result = await pool.record(sql.type(
    z.object({
      key: z.string(),
      value: z.number(),
    }),
  )`
    SELECT *
    FROM (VALUES ('foo', 1), ('bar', 2)) as t(key, value)
  `);

  t.deepEqual(result, {
    bar: 2,
    foo: 1,
  });
});

test("the order of the key and value columns is not significant", async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const result = await pool.record(sql.type(
    z.object({
      key: z.string(),
      value: z.number(),
    }),
  )`
    SELECT *
    FROM (VALUES (1, 'foo')) as t(value, key)
  `);

  t.deepEqual(result, {
    foo: 1,
  });
});

test("throws an error if columns are named anything other than key and value", async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const error = await t.throwsAsync(
    pool.record(sql.type(
      z.object({
        key: z.number(),
        value: z.number(),
      }),
    )`
      SELECT *
      FROM (VALUES (1, 2)) as t(id, count)
    `),
  );

  t.true(error instanceof DataIntegrityError);
});

test("throws an error if more than two columns are returned", async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const error = await t.throwsAsync(
    pool.record(sql.type(
      z.object({
        key: z.number(),
        value: z.number(),
      }),
    )`
      SELECT *
      FROM (VALUES (1, 2, 3)) as t(key, value, extra)
    `),
  );

  t.true(error instanceof DataIntegrityError);
});

test("throws an error if duplicate keys are returned", async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const error = await t.throwsAsync(
    pool.record(sql.type(
      z.object({
        key: z.number(),
        value: z.number(),
      }),
    )`
      SELECT *
      FROM (VALUES (1, 2), (1, 3)) as t(key, value)
    `),
  );

  t.true(error instanceof DataIntegrityError);
});

test("does not pollute the object prototype", async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
  });

  const result = await pool.record(sql.type(
    z.object({
      key: z.string(),
      value: z.string(),
    }),
  )`
    SELECT *
    FROM (VALUES ('__proto__', 'foo')) as t(key, value)
  `);

  t.is(Object.getPrototypeOf(result), Object.prototype);
  t.is(Object.getOwnPropertyDescriptor(result, "__proto__")?.value, "foo");
});
