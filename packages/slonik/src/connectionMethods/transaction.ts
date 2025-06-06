import { bindTransactionConnection } from '../binders/bindTransactionConnection.js';
import { TRANSACTION_ROLLBACK_ERROR_PREFIX } from '../constants.js';
import { transactionContext } from '../contexts/transactionContext.js';
import { getPoolClientState } from '../state.js';
import type { InternalTransactionFunction } from '../types.js';
import { BackendTerminatedError, UnexpectedStateError } from '@slonik/errors';
import { generateUid } from '@slonik/utilities';
import { serializeError } from 'serialize-error';

const execTransaction: InternalTransactionFunction = async (
  parentLog,
  connection,
  clientConfiguration,
  handler,
) => {
  const poolClientState = getPoolClientState(connection);

  await connection.query('START TRANSACTION');

  if (typeof poolClientState.transactionDepth !== 'number') {
    throw new UnexpectedStateError(
      'Cannot execute transaction without knowing the transaction depth.',
    );
  }

  try {
    const result = await handler(
      bindTransactionConnection(
        parentLog,
        connection,
        clientConfiguration,
        poolClientState.transactionDepth,
      ),
    );

    if (poolClientState.terminated) {
      throw new BackendTerminatedError(poolClientState.terminated);
    }

    await connection.query('COMMIT');

    return result;
  } catch (error) {
    if (!poolClientState.terminated) {
      await connection.query('ROLLBACK');

      parentLog.error(
        {
          error: serializeError(error),
        },
        'rolling back transaction due to an error',
      );
    }

    throw error;
  }
};

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

const retryTransaction: InternalTransactionFunction = async (
  parentLog,
  connection,
  clientConfiguration,
  handler,
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
          transactionId: poolClientState.transactionId,
        },
        'retrying transaction',
      );

      result = await execTransaction(
        parentLog,
        connection,
        clientConfiguration,
        handler,
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

export const transaction: InternalTransactionFunction = async (
  parentLog,
  connection,
  clientConfiguration,
  handler,
  transactionRetryLimit,
) => {
  const transactionId = generateUid();

  return transactionContext.run(
    {
      transactionId,
    },
    async () => {
      const poolClientState = getPoolClientState(connection);

      if (poolClientState.transactionDepth !== null) {
        throw new UnexpectedStateError(
          'Cannot use the same connection to start a new transaction before completing the last transaction.',
        );
      }

      poolClientState.transactionDepth = 0;
      poolClientState.transactionId = transactionId;

      const log = parentLog.child({
        transactionId: poolClientState.transactionId,
      });

      try {
        return await execTransaction(
          log,
          connection,
          clientConfiguration,
          handler,
        );
      } catch (error) {
        const transactionRetryLimitToUse =
          transactionRetryLimit ?? clientConfiguration.transactionRetryLimit;

        const shouldRetry =
          typeof error.code === 'string' &&
          error.code.startsWith(TRANSACTION_ROLLBACK_ERROR_PREFIX) &&
          transactionRetryLimitToUse > 0;

        if (shouldRetry) {
          return await retryTransaction(
            log,
            connection,
            clientConfiguration,
            handler,
            transactionRetryLimit,
          );
        } else {
          throw error;
        }
      } finally {
        poolClientState.transactionDepth = null;
        poolClientState.transactionId = null;
      }
    },
  );
};
