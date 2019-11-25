// @flow

import test from 'ava';
import createSqlTag from '../../../../src/factories/createSqlTag';
import {
  SqlToken,
} from '../../../../src/tokens';

const sql = createSqlTag();
const moment = Date.parse('2000-01-01 00:00:00.000');

test('creates a timestamp call', (t) => {
  const query = sql`SELECT ${sql.timestamp(moment)}`;

  t.deepEqual(query, {
    sql: 'SELECT to_timestamp($1)',
    type: SqlToken,
    values: [
      moment / 1000,
    ],
  });
});
