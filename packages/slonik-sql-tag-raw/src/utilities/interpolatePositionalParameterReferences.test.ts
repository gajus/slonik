import { interpolatePositionalParameterReferences } from './interpolatePositionalParameterReferences';
import test from 'ava';
import { sql } from 'slonik';

test('creates a plain sql token', (t) => {
  const sqlFragment = interpolatePositionalParameterReferences('foo', []);

  t.is(sqlFragment.sql, 'foo');

  t.deepEqual(sqlFragment.values, []);
});

test('creates a tuple with a single positional parameter', (t) => {
  const sqlFragment = interpolatePositionalParameterReferences('($1)', ['foo']);

  t.is(sqlFragment.sql, '($1)');

  t.deepEqual(sqlFragment.values, ['foo']);
});

test('interpolates SQL token', (t) => {
  const sqlFragment = interpolatePositionalParameterReferences('$1', [
    sql.fragment`to_timestamp(${'foo'})`,
  ]);

  t.is(sqlFragment.sql, 'to_timestamp($1)');

  t.deepEqual(sqlFragment.values, ['foo']);
});

test('throws an error if the greatest parameter position is greater than the number of parameter values', (t) => {
  t.throws(
    () => {
      interpolatePositionalParameterReferences('($1, $2)', ['foo']);
    },
    {
      message:
        'The greatest parameter position is greater than the number of parameter values.',
    },
  );
});

test('throws an error if least parameter is greater than 1', (t) => {
  t.throws(
    () => {
      interpolatePositionalParameterReferences('($2)', ['foo', 'bar']);
    },
    {
      message: 'Parameter position must start at 1.',
    },
  );
});
