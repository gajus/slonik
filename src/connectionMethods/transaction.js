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
  await connection.query('START TRANSACTION');

  const log = parentLog.child({
    transactionId: createUlid()
  });

  try {
    const result = await handler(bindTransactionConnection(log, connection, clientConfiguration));

    await connection.query('COMMIT');

    return result;
  } catch (error) {
    await connection.query('ROLLBACK');

    log.error({
      error: serializeError(error)
    }, 'rolling back transaction due to an error');

    throw error;
  }
};

export default transaction;
