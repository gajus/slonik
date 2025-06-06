import { bindTransactionConnection } from '../binders/bindTransactionConnection.js';
import { TRANSACTION_ROLLBACK_ERROR_PREFIX } from '../constants.js';
import { getPoolClientState } from '../state.js';
import type { InternalNestedTransactionFunction } from '../types.js';
import { generateUid } from '@slonik/utilities';
import { serializeError } from 'serialize-error';

const execNestedTransaction: InternalNestedTransactionFunction = async (
  parentLog,
  connection,
  clientConfiguration,
  handler,
  newTransactionDepth,
) => {
  await connection.query(
    'SAVEPOINT slonik_savepoint_' + String(newTransactionDepth),
  );

  try {
    const result = await handler(
      bindTransactionConnection(
        parentLog,
        connection,
        clientConfiguration,
        newTransactionDepth,
      ),
    );

    return result;
  } catch (error) {
    await connection.query(
      'ROLLBACK TO SAVEPOINT slonik_savepoint_' + String(newTransactionDepth),
    );

    parentLog.error(
      {
        error: serializeError(error),
      },
      'rolling back transaction due to an error',
    );

    throw error;
  }
};

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

const retryNestedTransaction: InternalNestedTransactionFunction = async (
  parentLog,
  connection,
  clientConfiguration,
  handler,
  transactionDepth,
  transactionRetryLimit,
) => {
  const poolClientState = getPoolClientState(connection);

  let remainingRetries =
    transactionRetryLimit ?? clientConfiguration.transactionRetryLimit;
  let attempt = 0;
  let result: Awaited<ReturnType<typeof handler>>;

  while (remainingRetries-- > 0) {
    attempt++;

    try {
      parentLog.trace(
        {
          attempt,
          parentTransactionId: poolClientState.transactionId,
        },
        'retrying nested transaction',
      );

      result = await execNestedTransaction(
        parentLog,
        connection,
        clientConfiguration,
        handler,
        transactionDepth,
      );

      // If the attempt succeeded break out of the loop
      break;
    } catch (error) {
      if (
        typeof error.code === 'string' &&
        error.code.startsWith(TRANSACTION_ROLLBACK_ERROR_PREFIX) &&
        remainingRetries > 0
      ) {
        continue;
      }

      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!;
};

export const nestedTransaction: InternalNestedTransactionFunction = async (
  parentLog,
  connection,
  clientConfiguration,
  handler,
  transactionDepth,
  transactionRetryLimit,
) => {
  const poolClientState = getPoolClientState(connection);

  const newTransactionDepth = transactionDepth + 1;

  const log = parentLog.child({
    transactionId: generateUid(),
  });

  try {
    poolClientState.transactionDepth = newTransactionDepth;

    return await execNestedTransaction(
      log,
      connection,
      clientConfiguration,
      handler,
      newTransactionDepth,
    );
  } catch (error) {
    const transactionRetryLimitToUse =
      transactionRetryLimit ?? clientConfiguration.transactionRetryLimit;

    const shouldRetry =
      typeof error.code === 'string' &&
      error.code.startsWith(TRANSACTION_ROLLBACK_ERROR_PREFIX) &&
      transactionRetryLimitToUse > 0;

    if (shouldRetry) {
      return await retryNestedTransaction(
        parentLog,
        connection,
        clientConfiguration,
        handler,
        newTransactionDepth,
        transactionRetryLimit,
      );
    } else {
      throw error;
    }
  } finally {
    poolClientState.transactionDepth = newTransactionDepth - 1;
  }
};
