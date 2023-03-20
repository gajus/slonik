import { createSqlTag } from '../../../../src/factories/createSqlTag';
import { FragmentToken } from '../../../../src/tokens';
import test from 'ava';

const sql = createSqlTag();

test('creates an object describing a query with an inlined literal value', (t) => {
  const query = sql.fragment`CREATE USER foo WITH PASSWORD ${sql.literalValue(
    'bar',
  )}`;

  t.deepEqual(query, {
    sql: "CREATE USER foo WITH PASSWORD 'bar'",
    type: FragmentToken,
    values: [],
  });
});
