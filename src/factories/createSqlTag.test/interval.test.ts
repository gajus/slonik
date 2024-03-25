import { FragmentToken } from '../../tokens';
import { createSqlTag } from '../createSqlTag';
import test from 'ava';

const sql = createSqlTag();

test('creates an empty make_interval invocation', (t) => {
  const query = sql.fragment`SELECT ${sql.interval({})}`;

  t.deepEqual(query, {
    sql: 'SELECT make_interval()',
    type: FragmentToken,
    values: [],
  });
});

test('creates an interval', (t) => {
  const query = sql.fragment`SELECT ${sql.interval({
    days: 4,
    hours: 5,
    minutes: 6,
    months: 2,
    seconds: 7,
    weeks: 3,
    years: 1,
  })}`;

  t.deepEqual(query, {
    sql: 'SELECT make_interval(years => $slonik_1, months => $slonik_2, weeks => $slonik_3, days => $slonik_4, hours => $slonik_5, mins => $slonik_6, secs => $slonik_7)',
    type: FragmentToken,
    values: [1, 2, 3, 4, 5, 6, 7],
  });
});

test('throws if contains unknown properties', (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT ${sql.interval({
      // @ts-expect-error - intentional
      foo: 'bar',
    })}`;
  });

  t.is(error?.message, 'Interval input must not contain unknown properties.');
});
