/**
 * Functions in this file are never actually run - they are purely
 * a type-level tests to ensure the typings don't regress.
 */

import {
  expectTypeOf,
} from 'expect-type';
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
  expectTypeOf(any).toMatchTypeOf<readonly any[]>();

  const anyTyped = await client.any(sql.type(Row)``);
  expectTypeOf(anyTyped).toMatchTypeOf<ReadonlyArray<{foo: string, }>>();

  // anyFirst
  const anyFirst = await client.anyFirst(sql``);
  expectTypeOf(anyFirst).toMatchTypeOf<any>();

  const anyFirstTyped = await client.anyFirst(sql.type(Row)``);
  expectTypeOf(anyFirstTyped).toMatchTypeOf<readonly string[]>();

  // many
  const many = await client.many(sql``);
  expectTypeOf(many).toMatchTypeOf<readonly any[]>();

  const manyTyped = await client.many(sql.type(Row)``);
  expectTypeOf(manyTyped).toMatchTypeOf<ReadonlyArray<{foo: string, }>>();

  // manyFirst
  const manyFirst = await client.manyFirst(sql``);
  expectTypeOf(manyFirst).toMatchTypeOf<readonly any[]>();

  const manyFirstTyped = await client.manyFirst(sql.type(Row)``);
  expectTypeOf(manyFirstTyped).toMatchTypeOf<readonly string[]>();

  // maybeOne
  const maybeOne = await client.maybeOne(sql``);
  expectTypeOf(maybeOne).toMatchTypeOf<any>();

  const maybeOneTyped = await client.maybeOne(sql.type(Row)``);
  expectTypeOf(maybeOneTyped).toMatchTypeOf<{foo: string, } | null>();

  // maybeOneFirst
  const maybeOneFirst = await client.maybeOneFirst(sql``);
  expectTypeOf(maybeOneFirst).toMatchTypeOf<any>();

  const maybeOneFirstTyped = await client.maybeOneFirst(sql.type(Row)``);
  expectTypeOf(maybeOneFirstTyped).toMatchTypeOf<string | null>();

  // one
  const one = await client.one(sql``);
  expectTypeOf(one).toMatchTypeOf<any>();

  const oneTyped = await client.one(sql.type(Row)``);
  expectTypeOf(oneTyped).toMatchTypeOf<{foo: string, }>();

  // oneFirst
  const oneFirst = await client.oneFirst(sql``);
  expectTypeOf(oneFirst).toMatchTypeOf<any>();

  const oneFirstTyped = await client.oneFirst(sql.type(Row)``);
  expectTypeOf(oneFirstTyped).toMatchTypeOf<string>();

  // query
  const query = await client.query(sql``);
  expectTypeOf(query).toMatchTypeOf<QueryResult<Record<string, any>>>();

  const queryTyped = await client.query(sql.type(Row)``);
  expectTypeOf(queryTyped).toMatchTypeOf<{rows: ReadonlyArray<{foo: string, }>, }>();
};
