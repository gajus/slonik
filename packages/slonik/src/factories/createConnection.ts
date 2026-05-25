import { bindPoolConnection } from "../binders/bindPoolConnection.js";
import { establishConnection } from "../routines/establishConnection.js";
import { getPoolClientState } from "../state.js";
import type {
  ClientConfiguration,
  Connection,
  DatabasePool,
  DatabasePoolConnection,
  Interceptor,
  Logger,
  MaybePromise,
} from "../types.js";
import type { ConnectionPool, ConnectionPoolClient } from "./createConnectionPool.js";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { UnexpectedStateError } from "@slonik/errors";
import type { QuerySqlToken } from "@slonik/sql-tag";

const tracer = trace.getTracer("slonik.interceptors");

type ConnectionHandlerType = (
  connectionLog: Logger,
  connection: ConnectionPoolClient,
  boundConnection: DatabasePoolConnection,
  clientConfiguration: ClientConfiguration,
) => MaybePromise<unknown>;

type PoolHandlerType = (pool: DatabasePool) => Promise<unknown>;

type AfterPoolConnectionContext = Parameters<NonNullable<Interceptor["afterPoolConnection"]>>[0];

type BeforePoolConnectionContext = Parameters<NonNullable<Interceptor["beforePoolConnection"]>>[0];

type BeforePoolConnectionReleaseContext = Parameters<
  NonNullable<Interceptor["beforePoolConnectionRelease"]>
>[0];

type SharedConnectionContext = {
  connectionId?: string;
  connectionType?: Connection;
  log: Logger;
  poolId: string;
  query?: null | QuerySqlToken;
};

const throwReleasedError = async () => {
  throw new Error("Cannot use released connection");
};

const boundConnectionMethods = [
  "any",
  "anyFirst",
  "exists",
  "many",
  "manyFirst",
  "maybeOne",
  "maybeOneFirst",
  "one",
  "oneFirst",
  "query",
  "stream",
  "transaction",
];

const destroyBoundConnection = (boundConnection: DatabasePoolConnection) => {
  for (const boundConnectionMethod of boundConnectionMethods) {
    boundConnection[boundConnectionMethod] = throwReleasedError;
  }
};

const raceError = async <T>(
  connection: ConnectionPoolClient,
  routine: () => Promise<T>,
): Promise<T> => {
  const connectionErrorPromise = Promise.withResolvers<T>();

  const onError = (error: Error) => {
    connectionErrorPromise.reject(error);
  };

  connection.on("error", onError);

  try {
    return await Promise.race([connectionErrorPromise.promise, routine()]);
  } finally {
    connection.removeListener("error", onError);
  }
};

export const createConnection = async (
  parentLog: Logger,
  pool: ConnectionPool,
  clientConfiguration: ClientConfiguration,
  connectionType: Connection,
  connectionHandler: ConnectionHandlerType,
  poolHandler: PoolHandlerType,
  query: null | QuerySqlToken = null,
) => {
  const { state } = pool.state();

  const poolId = pool.id();
  const connectionContext: SharedConnectionContext = {
    log: parentLog,
    poolId,
    query,
  };

  if (state === "ENDING") {
    throw new UnexpectedStateError(
      "Connection pool is being shut down. Cannot create a new connection.",
    );
  }

  if (state === "ENDED") {
    throw new UnexpectedStateError(
      "Connection pool has been shut down. Cannot create a new connection.",
    );
  }

  for (const interceptor of clientConfiguration.interceptors) {
    const beforePoolConnection = interceptor.beforePoolConnection;

    if (beforePoolConnection) {
      let maybeNewPool;

      if (clientConfiguration.tracing) {
        maybeNewPool = await tracer.startActiveSpan(
          "slonik.interceptor.beforePoolConnection",
          async (interceptorSpan) => {
            interceptorSpan.setAttribute("interceptor.name", interceptor.name);

            try {
              return await beforePoolConnection(connectionContext as BeforePoolConnectionContext);
            } catch (error) {
              interceptorSpan.recordException(error);
              interceptorSpan.setStatus({
                code: SpanStatusCode.ERROR,
                message: String(error),
              });

              throw error;
            } finally {
              interceptorSpan.end();
            }
          },
        );
      } else {
        maybeNewPool = await beforePoolConnection(connectionContext as BeforePoolConnectionContext);
      }

      if (maybeNewPool) {
        return await poolHandler(maybeNewPool);
      }
    }
  }

  const connection = await establishConnection(
    parentLog,
    pool,
    clientConfiguration.connectionRetryLimit,
    clientConfiguration.tracing,
  );

  const { connectionId } = getPoolClientState(connection);

  return await raceError(connection, async () => {
    const connectionLog = parentLog.child({
      connectionId,
    });

    connectionContext.connectionId = connectionId;
    connectionContext.connectionType = connectionType;
    connectionContext.log = connectionLog;

    delete connectionContext.query;

    const boundConnection = bindPoolConnection(connectionLog, connection, clientConfiguration);

    try {
      for (const interceptor of clientConfiguration.interceptors) {
        if (interceptor.afterPoolConnection) {
          await interceptor.afterPoolConnection(
            connectionContext as AfterPoolConnectionContext,
            boundConnection,
          );
        }
      }
    } catch (error) {
      await connection.destroy();

      throw error;
    }

    let result;

    try {
      result = await connectionHandler(
        connectionLog,
        connection,
        boundConnection,
        clientConfiguration,
      );
    } catch (error) {
      await connection.destroy();

      throw error;
    }

    const releaseConnection = async () => {
      try {
        for (const interceptor of clientConfiguration.interceptors) {
          if (interceptor.beforePoolConnectionRelease) {
            await interceptor.beforePoolConnectionRelease(
              connectionContext as BeforePoolConnectionReleaseContext,
              boundConnection,
            );
          }
        }
      } catch (error) {
        await connection.destroy();

        throw error;
      }

      destroyBoundConnection(boundConnection);

      try {
        await connection.release();
      } catch {
        await connection.destroy();
      }
    };

    releaseConnection().catch(() => {});

    return result;
  });
};
