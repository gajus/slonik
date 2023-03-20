import { createSqlTag } from '../../../../src/factories/createSqlTag';
import { FragmentToken } from '../../../../src/tokens';
import test from 'ava';

const sql = createSqlTag();

test('binds a timestamp', (t) => {
  const query = sql.fragment`SELECT ${sql.timestamp(
    new Date('2022-08-19T03:27:24.951Z'),
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT to_timestamp($1)',
    type: FragmentToken,
    values: ['1660879644.951'],
  });
});

test('throws if not instance of Date', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error
    sql.fragment`SELECT ${sql.timestamp(1)}`;
  });

  t.is(
    error?.message,
    'Timestamp parameter value must be an instance of Date.',
  );
});
