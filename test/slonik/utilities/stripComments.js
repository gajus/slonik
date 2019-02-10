// @flow

import test from 'ava';
import {
  stripComments
} from '../../../src/utilities';

test('removes content begining with -- from every line in the input', (t) => {
  const subject1 = stripComments(`
    SELECT 1
    FROM foo
  `);

  t.true(subject1 === 'SELECT 1 FROM foo');

  const subject2 = stripComments(`
    SELECT 1 --foo
    FROM foo --bar
  `);

  t.true(subject2 === 'SELECT 1 FROM foo');

  const subject3 = stripComments(`
    SELECT 1 -- foo
    -- bar FROM foo
  `);

  t.true(subject3 === 'SELECT 1');

  const subject4 = stripComments(`
    SELECT 1 -- foo

    -- bar FROM foo
  `);

  t.true(subject4 === 'SELECT 1');
});

test('removes multiline comment blocks', (t) => {
  const subject1 = stripComments(`
    SELECT 1
    /* FROM foo */
  `);

  t.true(subject1 === 'SELECT 1');

  const subject2 = stripComments(`
    SELECT 1 /* foo */
    FROM foo /* bar */
  `);

  t.true(subject2 === 'SELECT 1 FROM foo');

  const subject3 = stripComments(`
    /*
      foo
      bar
    */
    SELECT 1
    FROM foo
  `);

  t.true(subject3 === 'SELECT 1 FROM foo');
});
