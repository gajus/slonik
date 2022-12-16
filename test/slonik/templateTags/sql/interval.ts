import test from 'ava';
import {
  createSqlTag,
} from '../../../../src/factories/createSqlTag';
import {
  FragmentToken,
} from '../../../../src/tokens';

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
    days: 3,
    hours: 4,
    minutes: 5,
    months: 2,
    seconds: 6,
    years: 1,
  })}`;

  t.deepEqual(query, {
    sql: 'SELECT make_interval(years => $1, months => $2, days => $3, hours => $4, mins => $5, secs => $6)',
    type: FragmentToken,
    values: [
      1,
      2,
      3,
      4,
      5,
      6,
    ],
  });
});

test('throws if contains unknown properties', (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT ${sql.interval({
      // @ts-expect-error
      foo: 'bar',
    })}`;
  });

  t.is(error?.message, 'Interval input must not contain unknown properties.');
});
