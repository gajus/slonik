import test from 'ava';
import {
  removeCommentedOutBindings,
} from '../../../src/utilities/removeCommentedOutBindings';

test('removes commented out bindings', (t) => {
  t.deepEqual(
    removeCommentedOutBindings({
      sql: 'SELECT $1\n-- $2\n$3',
      values: [
        'foo',
        'bar',
        'baz',
      ],
    }),
    {
      sql: 'SELECT $1 $2',
      values: [
        'foo',
        'baz',
      ],
    },
  );
});

test('removes multiple commented out bindings', (t) => {
  t.deepEqual(
    removeCommentedOutBindings({
      sql: 'SELECT $1\n-- $2\n$3\n-- $4\n$5',
      values: [
        'foo',
        'bar',
        'baz',
        'qux',
        'quux',
      ],
    }),
    {
      sql: 'SELECT $1 $2 $3',
      values: [
        'foo',
        'baz',
        'quux',
      ],
    },
  );
});

test('removes multiple bindings in the same comment', (t) => {
  t.deepEqual(
    removeCommentedOutBindings({
      sql: 'SELECT $1\n-- $2 $3 $4\n$5',
      values: [
        'foo',
        'bar',
        'baz',
        'qux',
        'quux',
      ],
    }),
    {
      sql: 'SELECT $1 $2',
      values: [
        'foo',
        'quux',
      ],
    },
  );
});

test('removes multiple bindings in the same comment (block comment)', (t) => {
  t.deepEqual(
    removeCommentedOutBindings({
      sql: 'SELECT $1 /* $2 $3 $4 */ $5',
      values: [
        'foo',
        'bar',
        'baz',
        'qux',
        'quux',
      ],
    }),
    {
      sql: 'SELECT $1 $2',
      values: [
        'foo',
        'quux',
      ],
    },
  );
});

test('does not generate undefined values for $1 appearing in a string', (t) => {
  t.deepEqual(
    removeCommentedOutBindings({
      sql: 'SELECT \'$1\'',
      values: [],
    }),
    {
      sql: 'SELECT \'$1\'',
      values: [],
    },
  );
});

test('does not generate undefined values for $1 appearing in a prepared statement', (t) => {
  t.deepEqual(
    removeCommentedOutBindings({
      sql: 'PREPARE test_statement AS SELECT foo FROM bar WHERE baz = $1',
      values: [],
    }),
    {
      sql: 'PREPARE test_statement AS SELECT foo FROM bar WHERE baz = $1',
      values: [],
    },
  );
});
