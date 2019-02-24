// @flow

import serializeError from 'serialize-error';
import {
  bindTransactionConnection
} from '../binders';
import {
  createUlid
} from '../utilities';
import type {
  InternalTransactionFunctionType
} from '../types';

const transaction: InternalTransactionFunctionType = async (parentLog, connection, clientConfiguration, handler) => {
  if (connection.connection.slonik.transactionDepth !== null) {
    throw new Error('Cannot use the same connection to start a new transaction before completing the last transaction.');
  }

  connection.connection.slonik.transactionDepth = 0;
  connection.connection.slonik.transactionId = createUlid();

  await connection.query('START TRANSACTION');

  const log = parentLog.child({
    transactionId: connection.connection.slonik.transactionId
  });

  try {
    const result = await handler(bindTransactionConnection(log, connection, clientConfiguration, connection.connection.slonik.transactionDepth));

    await connection.query('COMMIT');

    return result;
  } catch (error) {
    await connection.query('ROLLBACK');

    log.error({
      error: serializeError(error)
    }, 'rolling back transaction due to an error');

    throw error;
  } finally {
    connection.connection.slonik.transactionDepth = null;
    connection.connection.slonik.transactionId = null;
  }
};

export default transaction;
