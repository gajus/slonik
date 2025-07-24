import { bindTransactionConnection } from '../binders/bindTransactionConnection.js';
import { TRANSACTION_ROLLBACK_ERROR_PREFIX } from '../constants.js';
import { transactionContext } from '../contexts/transactionContext.js';
import { getPoolClientState } from '../state.js';
import type {
  DatabaseTransactionEventEmitter,
  InternalTransactionFunction,
} from '../types.js';
import { BackendTerminatedError, UnexpectedStateError } from '@slonik/errors';
import { generateUid } from '@slonik/utilities';
import EventEmitter from 'node:events';
import { serializeError } from 'serialize-error';

const execTransaction: InternalTransactionFunction = async (
  parentLog,
  connection,
  clientConfiguration,
  handler,
  transactionRetryLimit,
  eventEmitter?: DatabaseTransactionEventEmitter,
  transactionId?: string,
) => {
  const poolClientState = getPoolClientState(connection);

  await connection.query('START TRANSACTION');

  if (typeof poolClientState.transactionDepth !== 'number') {
    throw new UnexpectedStateError(
      'Cannot execute transaction without knowing the transaction depth.',
    );
  }

  if (!eventEmitter || !transactionId) {
    throw new UnexpectedStateError(
      'Event emitter and transaction ID are required for transaction execution.',
    );
  }

  try {
    const result = await handler(
      bindTransactionConnection(
        parentLog,
        connection,
        clientConfiguration,
        poolClientState.transactionDepth,
        eventEmitter,
        transactionId,
      ),
    );

    if (poolClientState.terminated) {
      throw new BackendTerminatedError(poolClientState.terminated);
    }

    await connection.query('COMMIT');

    if (poolClientState.transactionDepth === 0) {
      eventEmitter.emit(
        'commit',
        transactionId,
        poolClientState.transactionDepth,
      );
    }

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

    eventEmitter.emit(
      'rollback',
      transactionId,
      poolClientState.transactionDepth,
      error as Error,
    );

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
  eventEmitter?: DatabaseTransactionEventEmitter,
  transactionId?: string,
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
        transactionRetryLimit,
        eventEmitter,
        transactionId,
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
  const eventEmitter = new EventEmitter() as DatabaseTransactionEventEmitter;

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
          transactionRetryLimit,
          eventEmitter,
          transactionId,
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
            eventEmitter,
            transactionId,
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
