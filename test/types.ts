import {
  expectTypeOf,
} from 'expect-type';
import {
  createPool,
  sql,
} from '../src';

// this is never actually run - it's purely a type-level "test" to ensure the typings don't regress.
export default async () => {
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
  expectTypeOf(one).toEqualTypeOf<Record<string, any>>();

  const oneTyped = await client.one<Row>(sql`select true`);
  expectTypeOf(oneTyped).toEqualTypeOf<Row>();

  const oneFirst = await client.oneFirst(sql`select true`);
  expectTypeOf(oneFirst).toBeAny();

  const oneFirstTyped = await client.oneFirst<Row>(sql`select true`);
  expectTypeOf(oneFirstTyped).toEqualTypeOf<string | boolean>();

  const maybeOneFirst = await client.maybeOneFirst(sql`select true`);
  expectTypeOf(maybeOneFirst).toBeAny();

  const maybeOneFirstTyped = await client.maybeOneFirst<Row>(sql`select true`);
  expectTypeOf(maybeOneFirstTyped).toEqualTypeOf<string | boolean | null>();

  const many = await client.many(sql`select true`);
  expectTypeOf(many).toEqualTypeOf<Record<string, any>[]>();

  const manyTyped = await client.many<Row>(sql`select true`);
  expectTypeOf(manyTyped).toEqualTypeOf<Row[]>();

  const manyFirst = await client.manyFirst(sql`select true`);
  expectTypeOf(manyFirst).toEqualTypeOf<any[]>();

  const manyFirstTyped = await client.manyFirst<Row>(sql`select true`);
  expectTypeOf(manyFirstTyped).toEqualTypeOf<Array<string | boolean>>();

  expectTypeOf(client.any).toEqualTypeOf(client.many);
  expectTypeOf(client.anyFirst).toEqualTypeOf(client.manyFirst);
};
