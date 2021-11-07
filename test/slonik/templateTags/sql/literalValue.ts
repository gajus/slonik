import test from 'ava';
import {
  createSqlTag,
} from '../../../../src/factories/createSqlTag';
import {
  SqlToken,
} from '../../../../src/tokens';

const sql = createSqlTag();

test('creates an object describing a query with an inlined literal value', (t) => {
  const query = sql`CREATE USER foo WITH PASSWORD ${sql.literalValue('bar')}`;

  t.deepEqual(query, {
    sql: 'CREATE USER foo WITH PASSWORD \'bar\'',
    type: SqlToken,
    values: [],
  });
});
