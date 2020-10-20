// @flow

/* eslint-disable promise/prefer-await-to-callbacks */

import type Stream from 'stream';
import through from 'through2';
import QueryStream from '../QueryStream';
import {
  UnexpectedStateError,
} from '../errors';
import {
  executeQuery,
} from '../routines';
import type {
  InterceptorType,
  InternalStreamFunctionType,
} from '../types';

const stream: InternalStreamFunctionType = async (connectionLogger, connection, clientConfiguration, rawSql, values, streamHandler) => {
  return executeQuery(
    connectionLogger,
    connection,
    clientConfiguration,
    rawSql,
    values,
    undefined,
    (finalConnection, finalSql, finalValues, executionContext, actualQuery) => {
      if (connection.connection.slonik.native) {
        throw new UnexpectedStateError('Result cursors do not work with the native driver. Use JavaScript driver.');
      }

      const query = new QueryStream(finalSql, finalValues);

      const queryStream: Stream = finalConnection.query(query);

      const rowTransformers: NonNullable<InterceptorType['transformRow']>[] = [];

      for (const interceptor of clientConfiguration.interceptors) {
        if (interceptor.transformRow) {
          rowTransformers.push(interceptor.transformRow);
        }
      }

      return new Promise((resolve, reject) => {
        queryStream.on('error', (error: Error) => {
          reject(error);
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformedStream = queryStream.pipe(through.obj(function (datum: any, enc: any, callback: any) {
          let finalRow = datum.row;

          if (rowTransformers.length) {
            for (const rowTransformer of rowTransformers) {
              finalRow = rowTransformer(executionContext, actualQuery, finalRow, datum.fields);
            }
          }

          // eslint-disable-next-line fp/no-this, babel/no-invalid-this
          this.push({
            fields: datum.fields,
            row: finalRow,
          });

          callback();
        }));

        transformedStream.on('end', () => {
          // @ts-ignore
          resolve({});
        });

        // Invoked if stream is destroyed using transformedStream.destroy().
        transformedStream.on('close', () => {
          // @ts-ignore
          resolve({});
        });

        streamHandler(transformedStream);
      });
    },
  );
};

export default stream;
