import { FragmentToken } from '../../tokens';
import { createSqlTag } from '../createSqlTag';
import test from 'ava';

const sql = createSqlTag();

test('binds a date', (t) => {
  const query = sql.fragment`SELECT ${sql.date(
    new Date('2022-08-19T03:27:24.951Z'),
  )}`;

  t.deepEqual(query, {
    sql: 'SELECT $slonik_1::date',
    type: FragmentToken,
    values: ['2022-08-19'],
  });
});

test('throws if not instance of Date', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error - intentional
    sql.fragment`SELECT ${sql.date(1)}`;
  });

  t.is(error?.message, 'Date parameter value must be an instance of Date.');
});
