// @flow

/* eslint-disable flowtype/no-weak-types */

import test from 'ava';
import sinon from 'sinon';
import {
  transaction
} from '../../src';

test('commits successful transaction', async (t) => {
  const query = sinon.stub();

  query.returns({});

  const connection = {
    query
  };

  const result = await transaction(connection, async () => {
    await query('FOO');

    return 'BAR';
  });

  t.true(result === 'BAR');

  t.true(query.args[0].length === 1);
  t.true(query.args[0][0] === 'START TRANSACTION');

  t.true(query.args[1].length === 1);
  t.true(query.args[1][0] === 'FOO');

  t.true(query.args[2].length === 1);
  t.true(query.args[2][0] === 'COMMIT');
});

test('rollbacks unsuccessful transaction', async (t) => {
  const query = sinon.stub();

  query.returns({});

  const connection = {
    query
  };

  const transactionExecution = transaction(connection, async () => {
    await query('FOO');

    throw new Error('Instigated error.');
  });

  await t.throws(transactionExecution);

  t.true(query.args[0].length === 1);
  t.true(query.args[0][0] === 'START TRANSACTION');

  t.true(query.args[1].length === 1);
  t.true(query.args[1][0] === 'FOO');

  t.true(query.args[2].length === 1);
  t.true(query.args[2][0] === 'ROLLBACK');
});
