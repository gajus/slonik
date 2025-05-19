import { FragmentToken } from '../../tokens.js';
import { createSqlTag } from '../createSqlTag.js';
import test from 'ava';

const sql = createSqlTag();

test('binds a uuid', (t) => {
  const query = sql.fragment`SELECT ${sql.uuid(
    '00000000-0000-0000-0000-000000000000',
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::uuid',
    type: FragmentToken,
    values: ['00000000-0000-0000-0000-000000000000'],
  });
});

test('throws if not valid uuid', (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT ${sql.uuid('1')}`;
  });

  t.is(error?.message, 'UUID parameter value must be a valid UUID.');
});
