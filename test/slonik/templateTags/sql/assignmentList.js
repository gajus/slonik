// @flow

import test from 'ava';
import createSqlTag from '../../../../src/factories/createSqlTag';
import {
  SqlToken,
} from '../../../../src/tokens';

const sql = createSqlTag();

test('creates a single value assignment', (t) => {
  const query = sql`SELECT ${sql.assignmentList({foo: 'bar'})}`;

  t.deepEqual(query, {
    sql: 'SELECT "foo" = $1',
    type: SqlToken,
    values: [
      'bar',
    ],
  });
});

test('interpolates SQL tokens', (t) => {
  const query = sql`SELECT ${sql.assignmentList({foo: sql.raw('to_timestamp($1)', ['bar'])})}`;

  t.deepEqual(query, {
    sql: 'SELECT "foo" = to_timestamp($1)',
    type: SqlToken,
    values: [
      'bar',
    ],
  });
});

test('creates multiple value assignment', (t) => {
  const query = sql`SELECT ${sql.assignmentList({
    baz: 'qux',
    foo: 'bar',
  })}`;

  t.deepEqual(query, {
    sql: 'SELECT "baz" = $1, "foo" = $2',
    type: SqlToken,
    values: [
      'qux',
      'bar',
    ],
  });
});

test('converts camel-case to snake-case', (t) => {
  const query = sql`SELECT ${sql.assignmentList({
    fooBar: 'baz',
  })}`;

  t.deepEqual(query, {
    sql: 'SELECT "foo_bar" = $1',
    type: SqlToken,
    values: [
      'baz',
    ],
  });
});

test('uses normalizeIdentifier to normalize identifier names', (t) => {
  const customSql = createSqlTag({
    normalizeIdentifier: (name) => {
      return name;
    },
  });

  const query = customSql`SELECT ${customSql.assignmentList({
    fooBar: 'baz',
  })}`;

  t.deepEqual(query, {
    sql: 'SELECT "fooBar" = $1',
    type: SqlToken,
    values: [
      'baz',
    ],
  });
});

test('the resulting object is immutable', (t) => {
  const token = sql.assignmentList({foo: 'bar'});

  t.throws(() => {
    // $FlowFixMe
    token.foo = 'bar';
  });
});
