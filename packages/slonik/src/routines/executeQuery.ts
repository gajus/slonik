import { TRANSACTION_ROLLBACK_ERROR_PREFIX } from '../constants';
import { transactionContext } from '../contexts/transactionContext';
import { type ConnectionPoolClient } from '../factories/createConnectionPool';
import { getPoolClientState } from '../state';
import {
  type ClientConfiguration,
  type Interceptor,
  type Logger,
  type Query,
  type QueryContext,
  type QueryId,
  type QueryResult,
  type QueryResultRow,
  type StreamResult,
} from '../types';
import { type DriverNotice } from '@slonik/driver';
import {
  BackendTerminatedError,
  BackendTerminatedUnexpectedlyError,
  InvalidInputError,
  SlonikError,
  TupleMovedToAnotherPartitionError,
  UnexpectedForeignConnectionError,
  UnexpectedStateError,
} from '@slonik/errors';
import {
  type PrimitiveValueExpression,
  type QuerySqlToken,
} from '@slonik/sql-tag';
import { defer, generateUid } from '@slonik/utilities';
import { getStackTrace } from 'get-stack-trace';
import { serializeError } from 'serialize-error';

type GenericQueryResult = StreamResult | QueryResult<QueryResultRow>;

export type ExecutionRoutine = (
  connection: ConnectionPoolClient,
  sql: string,
  values: readonly PrimitiveValueExpression[],
  queryContext: QueryContext,
  query: Query,
) => Promise<GenericQueryResult>;

type TransactionQuery = {
  readonly executionContext: QueryContext;
  readonly executionRoutine: ExecutionRoutine;
  readonly sql: string;
  readonly values: readonly PrimitiveValueExpression[];
};

const retryQuery = async (
  connectionLogger: Logger,
  connection: ConnectionPoolClient,
  query: TransactionQuery,
  retryLimit: number,
) => {
  let result: GenericQueryResult;
  let remainingRetries = retryLimit;
  let attempt = 0;

  // @todo Provide information about the queries being retried to the logger.
  while (remainingRetries-- > 0) {
    attempt++;

    try {
      connectionLogger.trace(
        {
          attempt,
          queryId: query.executionContext.queryId,
        },
        'retrying query',
      );

      result = await query.executionRoutine(
        connection,
        query.sql,

        // @todo Refresh execution context to reflect that the query has been re-tried.
        query.values,

        // This (probably) requires changing `queryId` and `queryInputTime`.
        // It should be needed only for the last query (because other queries will not be processed by the middlewares).
        query.executionContext,
        {
          sql: query.sql,
          values: query.values,
        },
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

type StackCrumb = {
  columnNumber: number | null;
  fileName: string | null;
  functionName: string | null;
  lineNumber: number | null;
};

// eslint-disable-next-line complexity
export const executeQuery = async (
  connectionLogger: Logger,
  connection: ConnectionPoolClient,
  clientConfiguration: ClientConfiguration,
  query: QuerySqlToken,
  inheritedQueryId: QueryId | undefined,
  executionRoutine: ExecutionRoutine,
  stream: boolean = false,
): Promise<
  StreamResult | QueryResult<Record<string, PrimitiveValueExpression>>
> => {
  const poolClientState = getPoolClientState(connection);

  if (poolClientState.terminated) {
    throw new BackendTerminatedError(poolClientState.terminated);
  }

  if (query.sql.trim() === '') {
    throw new InvalidInputError('Unexpected SQL input. Query cannot be empty.');
  }

  if (query.sql.trim() === '$1') {
    throw new InvalidInputError(
      'Unexpected SQL input. Query cannot be empty. Found only value binding.',
    );
  }

  const transactionStore = transactionContext.getStore();

  if (
    clientConfiguration.dangerouslyAllowForeignConnections !== true &&
    transactionStore?.transactionId &&
    transactionStore.transactionId !== poolClientState.transactionId
  ) {
    throw new UnexpectedForeignConnectionError();
  }

  const queryInputTime = process.hrtime.bigint();

  let stackTrace: StackCrumb[] | null = null;

  if (clientConfiguration.captureStackTrace) {
    stackTrace = getStackTrace();
  }

  const queryId = inheritedQueryId ?? generateUid();

  const log = connectionLogger.child({
    queryId,
  });

  const originalQuery = {
    // See comments in `formatSlonikPlaceholder` for more information.
    sql: query.sql.replaceAll('$slonik_', '$'),
    values: query.values,
  };

  let actualQuery = {
    ...originalQuery,
  };

  const executionContext: QueryContext = {
    connectionId: poolClientState.connectionId,
    log,
    originalQuery,
    poolId: poolClientState.poolId,
    queryId,
    queryInputTime,
    resultParser: query.parser,
    sandbox: {},
    stackTrace,
    transactionId: poolClientState.transactionId,
  };

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.beforeTransformQuery) {
      await interceptor.beforeTransformQuery(executionContext, actualQuery);
    }
  }

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.transformQuery) {
      actualQuery = interceptor.transformQuery(executionContext, actualQuery);
    }
  }

  let result: GenericQueryResult | null;

  if (!stream) {
    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.beforeQueryExecution) {
        result = await interceptor.beforeQueryExecution(
          executionContext,
          actualQuery,
        );

        if (result) {
          log.info(
            'beforeQueryExecution interceptor produced a result; short-circuiting query execution using beforeQueryExecution result',
          );

          return result;
        }
      }
    }
  }

  const notices: DriverNotice[] = [];

  const noticeListener = (notice: DriverNotice) => {
    notices.push(notice);
  };

  const activeQuery = defer<null>();

  const blockingPromise = poolClientState.activeQuery?.promise ?? null;

  poolClientState.activeQuery = activeQuery;

  await blockingPromise;

  connection.on('notice', noticeListener);

  const queryWithContext = {
    executionContext,
    executionRoutine,
    sql: actualQuery.sql,
    values: actualQuery.values,
  };

  try {
    try {
      try {
        result = await executionRoutine(
          connection,
          actualQuery.sql,
          actualQuery.values,
          executionContext,
          actualQuery,
        );
      } catch (error) {
        const shouldRetry =
          typeof error.code === 'string' &&
          error.code.startsWith(TRANSACTION_ROLLBACK_ERROR_PREFIX) &&
          clientConfiguration.queryRetryLimit > 0;

        // Transactions errors in queries that are part of a transaction are handled by the transaction/nestedTransaction functions
        if (shouldRetry && !poolClientState.transactionId) {
          result = await retryQuery(
            connectionLogger,
            connection,
            queryWithContext,
            clientConfiguration.queryRetryLimit,
          );
        } else {
          throw error;
        }
      }
    } catch (error) {
      // The driver is responsible for throwing an appropriately wrapped error.
      if (error instanceof BackendTerminatedError) {
        poolClientState.terminated = error;
      }

      // If the error has been already handled by the driver, then we should not wrap it again.
      if (!(error instanceof SlonikError)) {
        if (error.message === 'Connection terminated unexpectedly') {
          throw new BackendTerminatedUnexpectedlyError(error);
        }

        if (
          error.message.includes(
            'tuple to be locked was already moved to another partition due to concurrent update',
          )
        ) {
          throw new TupleMovedToAnotherPartitionError(error);
        }
      }

      error.notices = notices;

      throw error;
    } finally {
      connection.off('notice', noticeListener);

      activeQuery.resolve(null);
    }
  } catch (error) {
    log.error(
      {
        error: serializeError(error),
      },
      'execution routine produced an error',
    );

    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.queryExecutionError) {
        await interceptor.queryExecutionError(
          executionContext,
          actualQuery,
          error,
          notices,
        );
      }
    }

    error.notices = notices;

    throw error;
  }

  if (!result) {
    throw new UnexpectedStateError('Expected query result to be returned.');
  }

  // @ts-expect-error -- We want to keep notices as readonly for consumer, but write to it here.
  result.notices = notices;

  if (result.type === 'QueryResult') {
    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.afterQueryExecution) {
        await interceptor.afterQueryExecution(
          executionContext,
          actualQuery,
          result,
        );
      }
    }

    const interceptors: Interceptor[] =
      clientConfiguration.interceptors.slice();

    for (const interceptor of interceptors) {
      if (interceptor.transformRow) {
        const { transformRow } = interceptor;
        const { fields } = result;

        const rows: QueryResultRow[] = await Promise.all(
          result.rows.map((row) => {
            return transformRow(executionContext, actualQuery, row, fields);
          }),
        );

        result = {
          ...result,
          rows,
        };
      }
    }

    for (const interceptor of clientConfiguration.interceptors) {
      if (interceptor.beforeQueryResult) {
        await interceptor.beforeQueryResult(
          executionContext,
          actualQuery,
          result,
        );
      }
    }
  }

  return result;
};
