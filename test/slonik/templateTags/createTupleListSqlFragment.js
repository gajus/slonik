// @flow

import test from 'ava';
import createTupleListSqlFragment from '../../../src/templateTags/createTupleListSqlFragment';

test('creates a single tuple with a single parameter', (t) => {
  const sqlFragment = createTupleListSqlFragment({
    tuples: [
      [
        'foo'
      ]
    ],
    type: 'TUPLE_LIST'
  }, 0);

  t.true(sqlFragment.sql === '($1)');
  t.deepEqual(sqlFragment.parameters, ['foo']);
});

test('creates a comma separated list of tuples with a single parameter', (t) => {
  const sqlFragment = createTupleListSqlFragment({
    tuples: [
      [
        'foo'
      ],
      [
        'bar'
      ],
      [
        'baz'
      ]
    ],
    type: 'TUPLE_LIST'
  }, 0);

  t.true(sqlFragment.sql === '($1), ($2), ($3)');
  t.deepEqual(sqlFragment.parameters, ['foo', 'bar', 'baz']);
});

test('offsets parameter position', (t) => {
  const sqlFragment = createTupleListSqlFragment({
    tuples: [
      [
        'foo'
      ],
      [
        'bar'
      ],
      [
        'baz'
      ]
    ],
    type: 'TUPLE_LIST'
  }, 3);

  t.true(sqlFragment.sql === '($4), ($5), ($6)');
  t.deepEqual(sqlFragment.parameters, ['foo', 'bar', 'baz']);
});

test('throws an error if tuple has no members', (t) => {
  t.throws(() => {
    createTupleListSqlFragment({
      tuples: [
        []
      ],
      type: 'TUPLE_LIST'
    }, 0);
  }, 'Tuple must have at least 1 member.');
});

test('throws an error if tuple member number is inconsistent', (t) => {
  t.throws(() => {
    createTupleListSqlFragment({
      tuples: [
        [
          'foo',
          'foo'
        ],
        [
          'bar'
        ]
      ],
      type: 'TUPLE_LIST'
    }, 0);
  }, 'Each tuple in a list of tuples must have an equal number of members.');
});
