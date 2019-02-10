// @flow

import test from 'ava';
import sinon from 'sinon';
import log from '../../helpers/Logger';
import createClientConfiguration from '../../helpers/createClientConfiguration';
import transaction from '../../../src/connectionMethods/transaction';

test('commits successful transaction', async (t) => {
  const query = sinon.stub();

  query.returns({});

  const connection = {
    query
  };

  const result = await transaction(log, connection, createClientConfiguration(), async () => {
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

  const transactionExecution = transaction(log, connection, createClientConfiguration(), async () => {
    await query('FOO');

    throw new Error('Instigated error.');
  });

  await t.throwsAsync(transactionExecution);

  t.true(query.args[0].length === 1);
  t.true(query.args[0][0] === 'START TRANSACTION');

  t.true(query.args[1].length === 1);
  t.true(query.args[1][0] === 'FOO');

  t.true(query.args[2].length === 1);
  t.true(query.args[2][0] === 'ROLLBACK');
});
