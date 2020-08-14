// @flow

import {
  serializeError,
} from 'serialize-error';
import {
  bindTransactionConnection,
} from '../binders';
import type {
  InternalNestedTransactionFunctionType,
} from '../types';
import {
  createUlid,
} from '../utilities';

const nestedTransaction: InternalNestedTransactionFunctionType = async (parentLog, connection, clientConfiguration, handler, transactionDepth) => {
  const newTransactionDepth = transactionDepth + 1;

  if (connection.connection.slonik.mock === false) {
    await connection.query('SAVEPOINT slonik_savepoint_' + newTransactionDepth);
  }

  const log = parentLog.child({
    transactionId: createUlid(),
  });

  try {
    connection.connection.slonik.transactionDepth = newTransactionDepth;

    const result = await handler(bindTransactionConnection(log, connection, clientConfiguration, newTransactionDepth));

    return result;
  } catch (error) {
    if (connection.connection.slonik.mock === false) {
      await connection.query('ROLLBACK TO SAVEPOINT slonik_savepoint_' + newTransactionDepth);
    }

    log.error({
      error: serializeError(error),
    }, 'rolling back transaction due to an error');

    throw error;
  } finally {
    connection.connection.slonik.transactionDepth = newTransactionDepth - 1;
  }
};

export default nestedTransaction;
