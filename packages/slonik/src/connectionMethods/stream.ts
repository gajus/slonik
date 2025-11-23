import { executeQuery } from '../routines/executeQuery.js';
import type { ExecutionRoutine } from '../routines/executeQuery.js';
import type {
  ClientConfiguration,
  Interceptor,
  InternalStreamFunction,
  Query,
  QueryContext,
  QueryResultRow,
  StreamHandler,
} from '../types.js';
import type { DriverStreamResult } from '@slonik/driver';
import { SlonikError } from '@slonik/errors';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

type AsyncRowTransformer = NonNullable<Interceptor['transformRowAsync']>;
type RowTransformer = NonNullable<Interceptor['transformRow']>;
const createTransformStream = (
  clientConfiguration: ClientConfiguration,
  queryContext: QueryContext,
  query: Query,
) => {
  const rowTransformers: RowTransformer[] = [];

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.transformRow) {
      rowTransformers.push(interceptor.transformRow);
    }
  }

  const asyncRowTransformers: AsyncRowTransformer[] = [];

  for (const interceptor of clientConfiguration.interceptors) {
    if (interceptor.transformRowAsync) {
      asyncRowTransformers.push(interceptor.transformRowAsync);
    }
  }

  return new Transform({
    objectMode: true,
    async transform(datum: DriverStreamResult, enc, callback) {
      if (!datum.row) {
        callback(new Error('"row" not available'));

        return;
      }

      if (!datum.fields) {
        callback(new Error('"fields" not available'));

        return;
      }

      let finalRow = datum.row as QueryResultRow;

      // apply row transformers. Note this is done sequentially, as one transformer's result will be passed to the next.
      for (const rowTransformer of rowTransformers) {
        finalRow = rowTransformer(queryContext, query, finalRow, datum.fields);
      }

      for (const rowTransformer of asyncRowTransformers) {
        finalRow = await rowTransformer(
          queryContext,
          query,
          finalRow,
          datum.fields,
        );
      }

      this.push({
        data: finalRow,
        fields: datum.fields,
      });

      callback();
    },
  });
};

const createExecutionRoutine = <T>(
  clientConfiguration: ClientConfiguration,
  onStream: StreamHandler<T>,
): ExecutionRoutine => {
  return async (connection, sql, values, executionContext, actualQuery) => {
    const queryStream = connection.stream(sql, values as unknown[]);

    const transformStream = createTransformStream(
      clientConfiguration,
      executionContext,
      actualQuery,
    );

    let streamDestroyError: Error | null = null;

    const originalDestroy = transformStream.destroy.bind(transformStream);
    transformStream.destroy = function (error?: Error) {
      if (error && !streamDestroyError) {
        streamDestroyError = error;
      }

      return originalDestroy(error);
    };

    const streamErrorPromise = new Promise<void>((resolve, reject) => {
      transformStream.once('error', reject);
      transformStream.once('end', resolve);
      transformStream.once('finish', resolve);
    });

    onStream(transformStream);

    try {
      await Promise.race([
        pipeline(queryStream, transformStream),
        streamErrorPromise,
      ]);
    } catch (error) {
      if (streamDestroyError) {
        queryStream.destroy();
        if (!transformStream.destroyed) {
          transformStream.destroy();
        }

        throw streamDestroyError;
      }

      queryStream.destroy();
      if (!transformStream.destroyed) {
        transformStream.destroy();
      }

      throw error;
    }

    return {
      notices: [],
      type: 'StreamResult',
    };
  };
};

export const stream: InternalStreamFunction = async (
  connectionLogger,
  connection,
  clientConfiguration,
  slonikSql,
  onStream,
  uid,
) => {
  try {
    const result = await executeQuery(
      connectionLogger,
      connection,
      clientConfiguration,
      slonikSql,
      uid,
      createExecutionRoutine(clientConfiguration, onStream),
      true,
    );

    if (result.type === 'QueryResult') {
      throw new Error(
        'Query result cannot be returned in a streaming context.',
      );
    }

    return result;
  } catch (error) {
    if (error instanceof SlonikError) {
      connection.events.emit('error', error);
    }

    throw error;
  }
};
