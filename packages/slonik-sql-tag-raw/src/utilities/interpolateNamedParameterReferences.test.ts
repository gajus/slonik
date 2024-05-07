import { interpolateNamedParameterReferences } from './interpolateNamedParameterReferences';
import test from 'ava';
import { sql } from 'slonik';

test('does not error when placeholders are absent', (t) => {
  const sqlFragment = interpolateNamedParameterReferences('SELECT 1', {});

  t.is(sqlFragment.sql, 'SELECT 1');

  t.deepEqual(sqlFragment.values, []);
});

test('interpolates a named parameter reference', (t) => {
  const sqlFragment = interpolateNamedParameterReferences('SELECT :foo', {
    foo: 'FOO',
  });

  t.is(sqlFragment.sql, 'SELECT $slonik_1');

  t.deepEqual(sqlFragment.values, ['FOO']);
});

test('interpolates multiple named parameter references', (t) => {
  const sqlFragment = interpolateNamedParameterReferences('SELECT :foo, :bar', {
    bar: 'BAR',
    foo: 'FOO',
  });

  t.is(sqlFragment.sql, 'SELECT $slonik_1, $slonik_2');

  t.deepEqual(sqlFragment.values, ['FOO', 'BAR']);
});

test('interpolates multiple named parameter references (same name)', (t) => {
  const sqlFragment = interpolateNamedParameterReferences('SELECT :foo, :foo', {
    foo: 'FOO',
  });

  t.is(sqlFragment.sql, 'SELECT $slonik_1, $slonik_2');

  t.deepEqual(sqlFragment.values, ['FOO', 'FOO']);
});

test('interpolates SQL token', (t) => {
  const sqlFragment = interpolateNamedParameterReferences('SELECT :foo', {
    foo: sql.fragment`${'foo'}`,
  });

  t.is(sqlFragment.sql, 'SELECT $slonik_1');

  t.deepEqual(sqlFragment.values, ['foo']);
});

test('throws if named parameter references does not have a matching value', (t) => {
  t.throws(
    () => {
      interpolateNamedParameterReferences('SELECT :foo, :bar', {
        foo: 'FOO',
      });
    },
    {
      message: 'Named parameter reference does not have a matching value.',
    },
  );
});

test('throws if values object contains property names not present as named parameter references in the query', (t) => {
  t.throws(
    (): void => {
      interpolateNamedParameterReferences('SELECT :foo', {
        bar: 'BAR',
        foo: 'FOO',
      });
    },
    {
      message:
        'Values object contains value(s) not present as named parameter references in the query.',
    },
  );
});
