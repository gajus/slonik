// @flow

import serializeError from 'serialize-error';
import log from '../Logger';
import type {
  InternalTransactionFunctionType
} from '../types';

// @todo Throw an error if there is an attempt to create a transaction within an active transaction.
// @todo Throw an error if there is an attempt to pool#connect within an active transaction.
const transaction: InternalTransactionFunctionType = async (connection, handler) => {
  await connection.query('START TRANSACTION');

  try {
    const result = await handler(connection);

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
