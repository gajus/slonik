import { createSqlTag } from '../createSqlTag';
import anyTest, { type TestFn } from 'ava';
import { ROARR } from 'roarr';
import { z } from 'zod';

const test = anyTest as TestFn<{
  logs: unknown[];
}>;

test.beforeEach((t) => {
  t.context.logs = [];

  ROARR.write = (message) => {
    t.context.logs.push(JSON.parse(message));
  };
});

test('describes zod object associated with the query', (t) => {
  const typeAliases = {
    id: z.object({
      id: z.number(),
    }),
  };

  const sql = createSqlTag({
    typeAliases,
  });

  const query = sql.typeAlias('id')`
    SELECT 1 id
  `;

  t.is(query.parser, typeAliases.id);
});

test('cannot alias unknown fields', (t) => {
  const typeAliases = {
    id: z.object({
      id: z.number(),
    }),
  };

  const sql = createSqlTag({
    typeAliases,
  });

  t.throws(() => {
    // @ts-expect-error - intentional
    sql.typeAlias('void')`
      SELECT 1 id
    `;
  });
});
