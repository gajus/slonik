import { FragmentToken } from '../../tokens';
import { createSqlTag } from '../createSqlTag';
import test from 'ava';

const sql = createSqlTag();

test('binds a uuid', (t) => {
  const query = sql.fragment`SELECT ${sql.uuid(
    '00000000-0000-0000-0000-000000000000',
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT to_timestamp($slonik_1)',
    type: FragmentToken,
    values: ['1660879644.951'],
  });
});

test('throws if not instance of Date', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${sql.timestamp(1)}`;
  });

  t.is(
    error?.message,
    'Timestamp parameter value must be an instance of Date.',
  );
});
