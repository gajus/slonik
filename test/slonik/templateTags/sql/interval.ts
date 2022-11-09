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

test('throws if contains unknown properties', (t) => {
  const error = t.throws(() => {
    sql.fragment`SELECT ${sql.interval({
      // @ts-expect-error
      foo: 'bar',
    })}`;
  });

  t.is(error?.message, 'Interval input must not contain unknown properties.');
});
