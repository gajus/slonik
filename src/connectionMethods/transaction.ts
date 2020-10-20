// @flow

import {
  serializeError,
} from 'serialize-error';
import {
  bindTransactionConnection,
} from '../binders';
import {
  BackendTerminatedError,
  UnexpectedStateError,
} from '../errors';
import type {
  InternalTransactionFunctionType,
} from '../types';
import {
  createUlid,
} from '../utilities';

export const transaction: InternalTransactionFunctionType = async (parentLog, connection, clientConfiguration, handler) => {
  if (connection.connection.slonik.transactionDepth !== null) {
    throw new UnexpectedStateError('Cannot use the same connection to start a new transaction before completing the last transaction.');
  }

  connection.connection.slonik.transactionDepth = 0;
  connection.connection.slonik.transactionId = createUlid();
  connection.connection.slonik.transactionQueries = [];

  if (connection.connection.slonik.mock === false) {
    await connection.query('START TRANSACTION');
  }

  const log = parentLog.child({
    transactionId: connection.connection.slonik.transactionId,
  });

  try {
    const result = await handler(bindTransactionConnection(
      log,
      connection,
      clientConfiguration,
      connection.connection.slonik.transactionDepth,
    ));

    if (connection.connection.slonik.terminated) {
      throw new BackendTerminatedError(connection.connection.slonik.terminated);
    }

    if (connection.connection.slonik.mock === false) {
      await connection.query('COMMIT');
    }

    return result;
  } catch (error) {
    if (!connection.connection.slonik.terminated) {
      if (connection.connection.slonik.mock === false) {
        await connection.query('ROLLBACK');
      }

      log.error({
        error: serializeError(error),
      }, 'rolling back transaction due to an error');
    }

    throw error;
  } finally {
    connection.connection.slonik.transactionDepth = null;
    connection.connection.slonik.transactionId = null;
    connection.connection.slonik.transactionQueries = null;
  }
};
