import {
  serializeError,
} from 'serialize-error';
import {
  bindTransactionConnection,
} from '../binders';
import {
  TRANSACTION_ROLLBACK_ERROR_PREFIX,
} from '../constants';
import {
  BackendTerminatedError,
  UnexpectedStateError,
} from '../errors';
import type {
  InternalTransactionFunctionType,
} from '../types';
import {
  createUid,
} from '../utilities';

const execTransaction: InternalTransactionFunctionType = async (parentLog, connection, clientConfiguration, handler) => {
  if (connection.connection.slonik.mock === false) {
    await connection.query('START TRANSACTION');
  }

  try {
    const result = await handler(bindTransactionConnection(
      parentLog,
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

      parentLog.error({
        error: serializeError(error),
      }, 'rolling back transaction due to an error');
    }

    throw error;
  }
};

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

const retryTransaction: InternalTransactionFunctionType = async (parentLog, connection, clientConfiguration, handler, transactionRetryLimit) => {
  let remainingRetries = transactionRetryLimit ?? clientConfiguration.transactionRetryLimit;
  let attempt = 0;
  let result: Awaited<ReturnType<typeof handler>>;

  while (remainingRetries-- > 0) {
    attempt++;

    try {
      parentLog.trace({
        attempt,
        transactionId: connection.connection.slonik.transactionId,
      }, 'retrying transaction');

      result = await execTransaction(parentLog, connection, clientConfiguration, handler);

      // If the attempt succeeded break out of the loop
      break;
    } catch (error) {
      if (typeof error.code === 'string' && error.code.startsWith(TRANSACTION_ROLLBACK_ERROR_PREFIX) && remainingRetries > 0) {
        continue;
      }

      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!;
};

export const transaction: InternalTransactionFunctionType = async (parentLog, connection, clientConfiguration, handler, transactionRetryLimit) => {
  if (connection.connection.slonik.transactionDepth !== null) {
    throw new UnexpectedStateError('Cannot use the same connection to start a new transaction before completing the last transaction.');
  }

  connection.connection.slonik.transactionDepth = 0;
  connection.connection.slonik.transactionId = createUid();

  const log = parentLog.child({
    transactionId: connection.connection.slonik.transactionId,
  });

  try {
    return await execTransaction(log, connection, clientConfiguration, handler);
  } catch (error) {
    const transactionRetryLimitToUse = transactionRetryLimit ?? clientConfiguration.transactionRetryLimit;

    const shouldRetry = typeof error.code === 'string' && error.code.startsWith(TRANSACTION_ROLLBACK_ERROR_PREFIX) && transactionRetryLimitToUse > 0;

    if (shouldRetry) {
      return await retryTransaction(log, connection, clientConfiguration, handler, transactionRetryLimit);
    } else {
      throw error;
    }
  } finally {
    connection.connection.slonik.transactionDepth = null;
    connection.connection.slonik.transactionId = null;
  }
};
