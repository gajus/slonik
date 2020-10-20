import {
  expectTypeOf,
} from 'expect-type';
import {
  createPool,
  sql,
} from '../src';
import {
  PrimitiveValueExpressionType,
} from '../src/types';

// this is never actually run - it's purely a type-level "test" to ensure the typings don't regress.
export const types = async () => {
  const client = createPool('');

  const query = await client.query(sql`select true`);

  expectTypeOf(query).toMatchTypeOf<{
    readonly command: 'DELETE' | 'INSERT' | 'SELECT' | 'UPDATE';
    readonly fields: ReadonlyArray<{dataTypeId: number; name: string}>;
    readonly notices: ReadonlyArray<{code: string; message: string}>;
    readonly rowCount: number;
    readonly rows: ReadonlyArray<unknown>;
  }>();

  type Row = {foo: string; bar: boolean}

  const typedQuery = await client.query<Row>(sql`select true`);
  expectTypeOf(typedQuery).toMatchTypeOf<{rows: readonly Row[]}>();

  const one = await client.one(sql`select true`);
  expectTypeOf(one).toEqualTypeOf<Record<string, PrimitiveValueExpressionType>>();

  const oneTyped = await client.one<Row>(sql`select true`);
  expectTypeOf(oneTyped).toEqualTypeOf<Row>();

  const oneFirst = await client.oneFirst(sql`select true`);
  expectTypeOf(oneFirst).toEqualTypeOf<PrimitiveValueExpressionType>();

  const oneFirstTyped = await client.oneFirst<boolean>(sql`select true`);
  expectTypeOf(oneFirstTyped).toEqualTypeOf<boolean>();

  const oneFirstTypedQuery = await client.oneFirst(sql<Row>`select true`);
  expectTypeOf(oneFirstTypedQuery).toEqualTypeOf<string | boolean>();

  const maybeOneFirst = await client.maybeOneFirst(sql`select true`);
  expectTypeOf(maybeOneFirst).toEqualTypeOf<PrimitiveValueExpressionType>();

  const maybeOneFirstTyped = await client.maybeOneFirst<boolean>(sql`select true`);
  expectTypeOf(maybeOneFirstTyped).toEqualTypeOf<boolean | null>();

  const maybeOneFirstTypedQuery = await client.maybeOneFirst(sql<Row>`select true`);
  expectTypeOf(maybeOneFirstTypedQuery).toEqualTypeOf<string | boolean | null>();

  const many = await client.many(sql`select true`);
  expectTypeOf(many).toEqualTypeOf<readonly Record<string, PrimitiveValueExpressionType>[]>();

  const manyTyped = await client.many<Row>(sql`select true`);
  expectTypeOf(manyTyped).toEqualTypeOf<readonly Row[]>();

  const manyFirst = await client.manyFirst(sql`select true`);
  expectTypeOf(manyFirst).toEqualTypeOf<PrimitiveValueExpressionType[]>();

  const manyFirstTyped = await client.manyFirst<boolean>(sql`select true`);
  expectTypeOf(manyFirstTyped).toEqualTypeOf<boolean[]>();

  const manyFirstTypedQuery = await client.manyFirst(sql<Row>`select true`);
  expectTypeOf(manyFirstTypedQuery).toEqualTypeOf<Array<string | boolean>>();

  expectTypeOf(client.any).toEqualTypeOf(client.many);
  expectTypeOf(client.anyFirst).toEqualTypeOf(client.manyFirst);
};
