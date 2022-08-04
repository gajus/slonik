/**
 * Functions in this file are never actually run - they are purely
 * a type-level tests to ensure the typings don't regress.
 */

import {
  expectType,
} from 'tsd';
import {
  z,
} from 'zod';
import {
  createPool,
  sql,
} from '../src';
import {
  type QueryResult,
} from '../src/types';

const Row = z.object({
  foo: z.string(),
});

export const queryMethods = async (): Promise<void> => {
  const client = createPool('');

  // any
  const any = await client.any(sql``);
  expectType<readonly any[]>(any);

  const anyTyped = await client.any(sql.type(Row)``);
  expectType<ReadonlyArray<{foo: string, }>>(anyTyped);

  // anyFirst
  const anyFirst = await client.anyFirst(sql``);
  expectType<any>(anyFirst);

  const anyFirstTyped = await client.anyFirst(sql.type(Row)``);
  expectType<readonly string[]>(anyFirstTyped);

  // many
  const many = await client.many(sql``);
  expectType<readonly any[]>(many);

  const manyTyped = await client.many(sql.type(Row)``);
  expectType<ReadonlyArray<{foo: string, }>>(manyTyped);

  // manyFirst
  const manyFirst = await client.manyFirst(sql``);
  expectType<readonly any[]>(manyFirst);

  const manyFirstTyped = await client.manyFirst(sql.type(Row)``);
  expectType<readonly string[]>(manyFirstTyped);

  // maybeOne
  const maybeOne = await client.maybeOne(sql``);
  expectType<any>(maybeOne);

  const maybeOneTyped = await client.maybeOne(sql.type(Row)``);
  expectType<{foo: string, } | null>(maybeOneTyped);

  // maybeOneFirst
  const maybeOneFirst = await client.maybeOneFirst(sql``);
  expectType<any>(maybeOneFirst);

  const maybeOneFirstTyped = await client.maybeOneFirst(sql.type(Row)``);
  expectType<string | null>(maybeOneFirstTyped);

  // one
  const one = await client.one(sql``);
  expectType<Record<string, any>>(one);

  const oneTyped = await client.one(sql.type(Row)``);
  expectType<{foo: string, }>(oneTyped);

  // oneFirst
  const oneFirst = await client.oneFirst(sql``);
  expectType<any>(oneFirst);

  const oneFirstTyped = await client.oneFirst(sql.type(Row)``);
  expectType<string>(oneFirstTyped);

  // query
  const query = await client.query(sql``);
  expectType<QueryResult<Record<string, any>>>(query);

  const queryTyped = await client.query(sql.type(Row)``);
  expectType<{rows: ReadonlyArray<{foo: string, }>, }>(queryTyped);
};
