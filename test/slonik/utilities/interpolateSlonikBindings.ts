import test from 'ava';
import {
  interpolateSlonikBindings,
} from '../../../src/utilities/interpolateSlonikBindings';

// All of these tests assume that the SQL was constructed using Slonik, i.e.
// sql`SELECT ${'foo'} /* ${'bar'} */ ${'baz'}`
test('removes commented out bindings', (t) => {
  t.deepEqual(
    interpolateSlonikBindings({
      sql: 'SELECT #$#1 \n-- #$#2\n#$#3',
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
    interpolateSlonikBindings({
      sql: 'SELECT #$#1\n-- #$#2\n#$#3\n-- #$#4\n#$#5',
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
    interpolateSlonikBindings({
      sql: 'SELECT #$#1\n-- #$#2 #$#3 #$#4\n#$#5',
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
    interpolateSlonikBindings({
      sql: 'SELECT #$#1 /* #$#2 #$#3 #$#4 */ #$#5',
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

test('does not remove bindings within string literals', (t) => {
  t.deepEqual(
    interpolateSlonikBindings({
      sql: 'SELECT #$#1, \'$2\', \'$3\', #$#2',
      values: [
        'foo',
        'bar',
      ],
    }),
    {
      sql: 'SELECT $1, \'$2\', \'$3\', $2',
      values: [
        'foo',
        'bar',
      ],
    },
  );
});
