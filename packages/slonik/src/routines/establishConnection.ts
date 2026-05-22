import type { ConnectionPool, ConnectionPoolClient } from "../factories/createConnectionPool.js";
import { poolClientStateMap } from "../state.js";
import type { Logger } from "../types.js";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { ConnectionError, UnexpectedStateError } from "@slonik/errors";
import { generateUid } from "@slonik/utilities";
import { serializeError } from "serialize-error";

const tracer = trace.getTracer("slonik");

const acquireConnection = async (
  parentLog: Logger,
  pool: ConnectionPool,
  connectionRetryLimit: number,
) => {
  let connection: ConnectionPoolClient;

  let remainingConnectionRetryLimit = connectionRetryLimit + 1;
  while (true) {
    remainingConnectionRetryLimit--;

    try {
      connection = await pool.acquire();

      poolClientStateMap.set(connection, {
        connectionId: generateUid(),
        poolId: pool.id(),
        terminated: null,
        transactionDepth: null,
        transactionId: null,
      });

      break;
    } catch (error) {
      parentLog.error(
        {
          error: serializeError(error),
          remainingConnectionRetryLimit,
        },
        "cannot establish connection",
      );

      if (remainingConnectionRetryLimit > 1) {
        parentLog.info("retrying connection");

        continue;
      } else {
        throw new ConnectionError(error.message, {
          cause: error,
        });
      }
    }
  }

  if (!connection) {
    throw new UnexpectedStateError("Connection handle is not present.");
  }

  return connection;
};

export const establishConnection = async (
  parentLog: Logger,
  pool: ConnectionPool,
  connectionRetryLimit: number,
  tracing: boolean = true,
) => {
  if (!tracing) {
    return await acquireConnection(parentLog, pool, connectionRetryLimit);
  }

  return await tracer.startActiveSpan("slonik.acquireConnection", async (span) => {
    try {
      return await acquireConnection(parentLog, pool, connectionRetryLimit);
    } catch (error) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: String(error),
      });

      throw error;
    } finally {
      span.end();
    }
  });
};
