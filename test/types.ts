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
  type PrimitiveValueExpression,
  type QueryResult,
} from '../src/types';

const ZodRow = z.object({
  bar: z.boolean(),
  foo: z.string(),
});

export const queryMethods = async (): Promise<void> => {
  const client = createPool('');

  type Row = {
    bar: boolean,
    foo: string,
  };

  // any
  const any = await client.any(sql``);
  expectTypeOf(any).toEqualTypeOf<ReadonlyArray<Record<string, PrimitiveValueExpression>>>();

  const anyTyped = await client.any<Row>(sql``);
  expectTypeOf(anyTyped).toEqualTypeOf<readonly Row[]>();

  const anyTypedQuery = await client.any(sql<Row>``);
  expectTypeOf(anyTypedQuery).toEqualTypeOf<readonly Row[]>();

  const anyZodTypedQuery = await client.any(sql.type(ZodRow)``);
  expectTypeOf(anyZodTypedQuery).toEqualTypeOf<readonly Row[]>();

  // anyFirst
  const anyFirst = await client.anyFirst(sql``);
  expectTypeOf(anyFirst).toEqualTypeOf<readonly PrimitiveValueExpression[]>();

  const anyFirstTyped = await client.anyFirst<boolean>(sql``);
  expectTypeOf(anyFirstTyped).toEqualTypeOf<readonly boolean[]>();

  const anyFirstTypedQuery = await client.anyFirst(sql<Row>``);
  expectTypeOf(anyFirstTypedQuery).toEqualTypeOf<ReadonlyArray<boolean | string>>();

  const anyFirstZodTypedQuery = await client.anyFirst(sql.type(ZodRow)``);
  expectTypeOf(anyFirstZodTypedQuery).toEqualTypeOf<ReadonlyArray<boolean | string>>();

  // many
  const many = await client.many(sql``);
  expectTypeOf(many).toEqualTypeOf<ReadonlyArray<Record<string, PrimitiveValueExpression>>>();

  const manyTyped = await client.many<Row>(sql``);
  expectTypeOf(manyTyped).toEqualTypeOf<readonly Row[]>();

  const manyTypedQuery = await client.many(sql<Row>``);
  expectTypeOf(manyTypedQuery).toEqualTypeOf<readonly Row[]>();

  const manyZodTypedQuery = await client.many(sql.type(ZodRow)``);
  expectTypeOf(manyZodTypedQuery).toEqualTypeOf<readonly Row[]>();

  // manyFirst
  const manyFirst = await client.manyFirst(sql``);
  expectTypeOf(manyFirst).toEqualTypeOf<readonly PrimitiveValueExpression[]>();

  const manyFirstTyped = await client.manyFirst<boolean>(sql``);
  expectTypeOf(manyFirstTyped).toEqualTypeOf<readonly boolean[]>();

  const manyFirstTypedQuery = await client.manyFirst(sql<Row>``);
  expectTypeOf(manyFirstTypedQuery).toEqualTypeOf<ReadonlyArray<boolean | string>>();

  const manyFirstZodTypedQuery = await client.manyFirst(sql.type(ZodRow)``);
  expectTypeOf(manyFirstZodTypedQuery).toEqualTypeOf<ReadonlyArray<boolean | string>>();

  // maybeOne
  const maybeOne = await client.maybeOne(sql``);
  expectTypeOf(maybeOne).toEqualTypeOf<Record<string, PrimitiveValueExpression> | null>();

  const maybeOneTyped = await client.maybeOne<Row>(sql``);
  expectTypeOf(maybeOneTyped).toEqualTypeOf<Row | null>();

  const maybeOneTypedQuery = await client.maybeOne(sql<Row>``);
  expectTypeOf(maybeOneTypedQuery).toEqualTypeOf<Row | null>();

  const maybeOneZodTypedQuery = await client.maybeOne(sql.type(ZodRow)``);
  expectTypeOf(maybeOneZodTypedQuery).toEqualTypeOf<Row | null>();

  // maybeOneFirst
  const maybeOneFirst = await client.maybeOneFirst(sql``);
  expectTypeOf(maybeOneFirst).toEqualTypeOf<PrimitiveValueExpression>();

  const maybeOneFirstTyped = await client.maybeOneFirst<boolean>(sql``);
  expectTypeOf(maybeOneFirstTyped).toEqualTypeOf<boolean | null>();

  const maybeOneFirstTypedQuery = await client.maybeOneFirst(sql<Row>``);
  expectTypeOf(maybeOneFirstTypedQuery).toEqualTypeOf<boolean | string | null>();

  const maybeOneFirstZodTypedQuery = await client.maybeOneFirst(sql.type(ZodRow)``);
  expectTypeOf(maybeOneFirstZodTypedQuery).toEqualTypeOf<boolean | string | null>();

  // one
  const one = await client.one(sql``);
  expectTypeOf(one).toEqualTypeOf<Record<string, PrimitiveValueExpression>>();

  const oneTyped = await client.one<Row>(sql``);
  expectTypeOf(oneTyped).toEqualTypeOf<Row>();

  const oneTypedQuery = await client.one(sql<Row>``);
  expectTypeOf(oneTypedQuery).toEqualTypeOf<Row>();

  const oneZodTypedQuery = await client.one(sql.type(ZodRow)``);
  expectTypeOf(oneZodTypedQuery).toEqualTypeOf<Row>();

  // oneFirst
  const oneFirst = await client.oneFirst(sql``);
  expectTypeOf(oneFirst).toEqualTypeOf<PrimitiveValueExpression>();

  const oneFirstTyped = await client.oneFirst<boolean>(sql``);
  expectTypeOf(oneFirstTyped).toEqualTypeOf<boolean>();

  const oneFirstTypedQuery = await client.oneFirst(sql<Row>``);
  expectTypeOf(oneFirstTypedQuery).toEqualTypeOf<boolean | string>();

  const oneFirstZodTypedQuery = await client.oneFirst(sql.type(ZodRow)``);
  expectTypeOf(oneFirstZodTypedQuery).toEqualTypeOf<boolean | string>();

  // query
  const query = await client.query(sql``);
  expectTypeOf(query).toMatchTypeOf<QueryResult<Record<string, PrimitiveValueExpression>>>();

  const queryTyped = await client.query<Row>(sql``);
  expectTypeOf(queryTyped).toMatchTypeOf<{rows: readonly Row[], }>();

  const queryTypedQuery = await client.query(sql<Row>``);
  expectTypeOf(queryTypedQuery).toMatchTypeOf<{ rows: readonly Row[], }>();

  const queryZodTypedQuery = await client.query(sql.type(ZodRow)``);
  expectTypeOf(queryZodTypedQuery).toMatchTypeOf<{ rows: readonly Row[], }>();

  type RowWithJSONB = {
    foo: {
      bar: number,
    },
  };

  const jsonbSql = sql<RowWithJSONB>`select '{"bar": 123}'::jsonb as foo`;

  expectTypeOf(await client.query(jsonbSql)).toEqualTypeOf<QueryResult<RowWithJSONB>>();
  expectTypeOf(await client.one(jsonbSql)).toEqualTypeOf<RowWithJSONB>();
  expectTypeOf(await client.maybeOne(jsonbSql)).toEqualTypeOf<RowWithJSONB | null>();
  expectTypeOf(await client.any(jsonbSql)).toEqualTypeOf<readonly RowWithJSONB[]>();
  expectTypeOf(await client.many(jsonbSql)).toEqualTypeOf<readonly RowWithJSONB[]>();
  expectTypeOf(await client.oneFirst(jsonbSql)).toEqualTypeOf<{ bar: number, }>();
  expectTypeOf(await client.maybeOneFirst(jsonbSql)).toEqualTypeOf<{ bar: number, } | null>();
  expectTypeOf(await client.manyFirst(jsonbSql)).toEqualTypeOf<ReadonlyArray<{ bar: number, }>>();
  expectTypeOf(await client.anyFirst(jsonbSql)).toEqualTypeOf<ReadonlyArray<{ bar: number, }>>();
};
