import anyTest, {
  type TestFn,
} from 'ava';
import {
  ROARR,
} from 'roarr';
import {
  z,
} from 'zod';
import {
  createSqlTag,
} from '../../../../src/factories/createSqlTag';

const test = anyTest as TestFn<{
  logs: unknown[],
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
