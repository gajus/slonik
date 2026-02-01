/**
 * Functions in this file are never actually run - they are purely
 * a type-level tests to ensure the typings don't regress.
 */

import { createPool, createSqlTag } from './index.js';
import type { QueryResult } from './types.js';
import test from 'ava';
import { expectTypeOf } from 'expect-type';
import { z } from 'zod';

test('ok', (t) => {
  t.true(true);
});

const ZodRow = z.object({
  bar: z.boolean(),
  foo: z.string(),
});

export const queryMethods = async (): Promise<void> => {
  const client = await createPool('');

  type Row = {
    bar: boolean;
    foo: string;
  };

  const sql = createSqlTag({
    typeAliases: {
      row: ZodRow,
    },
  });

  // parser
  const parser = sql.type(ZodRow)``.parser;
  expectTypeOf(parser).toEqualTypeOf<typeof ZodRow>();

  // any
  const any = await client.any(sql.unsafe``);
  expectTypeOf(any).toEqualTypeOf<readonly unknown[]>();

  const anyZodTypedQuery = await client.any(sql.type(ZodRow)``);
  expectTypeOf(anyZodTypedQuery).toEqualTypeOf<readonly Row[]>();

  const anyZodAliasQuery = await client.any(sql.typeAlias('row')``);
  expectTypeOf(anyZodAliasQuery).toEqualTypeOf<readonly Row[]>();

  // anyFirst
  const anyFirst = await client.anyFirst(sql.unsafe``);
  expectTypeOf(anyFirst).toEqualTypeOf<readonly unknown[]>();

  const anyFirstZodTypedQuery = await client.anyFirst(sql.type(ZodRow)``);
  expectTypeOf(anyFirstZodTypedQuery).toEqualTypeOf<
    ReadonlyArray<boolean | string>
  >();

  // many
  const many = await client.many(sql.unsafe``);
  expectTypeOf(many).toEqualTypeOf<readonly unknown[]>();

  const manyZodTypedQuery = await client.many(sql.type(ZodRow)``);
  expectTypeOf(manyZodTypedQuery).toEqualTypeOf<readonly Row[]>();

  // manyFirst
  const manyFirst = await client.manyFirst(sql.unsafe``);
  expectTypeOf(manyFirst).toEqualTypeOf<readonly unknown[]>();

  const manyFirstZodTypedQuery = await client.manyFirst(sql.type(ZodRow)``);
  expectTypeOf(manyFirstZodTypedQuery).toEqualTypeOf<
    ReadonlyArray<boolean | string>
  >();

  // maybeOne
  const maybeOne = await client.maybeOne(sql.unsafe``);
  expectTypeOf(maybeOne).toEqualTypeOf<unknown>();

  const maybeOneZodTypedQuery = await client.maybeOne(sql.type(ZodRow)``);
  expectTypeOf(maybeOneZodTypedQuery).toEqualTypeOf<null | Row>();

  // maybeOneFirst
  const maybeOneFirst = await client.maybeOneFirst(sql.unsafe``);
  expectTypeOf(maybeOneFirst).toEqualTypeOf<unknown>();

  const maybeOneFirstZodTypedQuery = await client.maybeOneFirst(
    sql.type(ZodRow)``,
  );
  expectTypeOf(maybeOneFirstZodTypedQuery).toEqualTypeOf<
    boolean | null | string
  >();

  // one
  const one = await client.one(sql.unsafe``);
  expectTypeOf(one).toEqualTypeOf<unknown>();

  const oneZodTypedQuery = await client.one(sql.type(ZodRow)``);
  expectTypeOf(oneZodTypedQuery).toEqualTypeOf<Row>();

  // oneFirst
  const oneFirst = await client.oneFirst(sql.unsafe``);
  expectTypeOf(oneFirst).toEqualTypeOf<unknown>();

  const oneFirstZodTypedQuery = await client.oneFirst(sql.type(ZodRow)``);
  expectTypeOf(oneFirstZodTypedQuery).toEqualTypeOf<boolean | string>();

  // query
  const query = await client.query(sql.unsafe``);
  expectTypeOf(query).toMatchTypeOf<QueryResult<any>>();

  const queryZodTypedQuery = await client.query(sql.type(ZodRow)``);
  expectTypeOf(queryZodTypedQuery).toMatchTypeOf<{ rows: readonly Row[] }>();

  const FooBarRow = z.object({
    x: z.string(),
    y: z.number(),
  });

  expectTypeOf(
    await client.one(sql.type(FooBarRow)`select 'x' x, 123 y`),
  ).toEqualTypeOf<{ x: string; y: number }>();
  expectTypeOf(
    await client.any(sql.type(FooBarRow)`select 'x' x, 123 y`),
  ).toEqualTypeOf<ReadonlyArray<{ x: string; y: number }>>();
};
