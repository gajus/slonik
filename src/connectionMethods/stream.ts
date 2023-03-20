import { QueryStream } from '../QueryStream';
import { executeQuery } from '../routines';
import { type Interceptor, type InternalStreamFunction } from '../types';
import { type Readable } from 'node:stream';
import * as through from 'through2';

export const stream: InternalStreamFunction = async (
  connectionLogger,
  connection,
  clientConfiguration,
  slonikSql,
  streamHandler,
  uid,
  options,
) => {
  return await executeQuery(
    connectionLogger,
    connection,
    clientConfiguration,
    slonikSql,
    undefined,
    async (
      finalConnection,
      finalSql,
      finalValues,
      executionContext,
      actualQuery,
    ) => {
      const query = new QueryStream(finalSql, finalValues, options);

      const queryStream: Readable = finalConnection.query(query);

      const rowTransformers: Array<NonNullable<Interceptor['transformRow']>> =
        [];

      for (const interceptor of clientConfiguration.interceptors) {
        if (interceptor.transformRow) {
          rowTransformers.push(interceptor.transformRow);
        }
      }

      return await new Promise((resolve, reject) => {
        queryStream.on('error', (error: Error) => {
          reject(error);
        });

        const transformedStream = queryStream.pipe(
          through.obj(function (datum, enc, callback) {
            let finalRow = datum.row;

            if (rowTransformers.length) {
              for (const rowTransformer of rowTransformers) {
                finalRow = rowTransformer(
                  executionContext,
                  actualQuery,
                  finalRow,
                  datum.fields,
                );
              }
            }

            // eslint-disable-next-line @babel/no-invalid-this
            this.push({
              fields: datum.fields,
              row: finalRow,
            });

            callback();
          }),
        );

        transformedStream.on('end', () => {
          resolve({
            command: 'SELECT',
            fields: [],
            notices: [],
            rowCount: 0,
            rows: [],
          });
        });

        // Invoked if stream is destroyed using transformedStream.destroy().
        transformedStream.on('close', () => {
          if (!queryStream.destroyed) {
            queryStream.destroy();
          }

          resolve({
            command: 'SELECT',
            fields: [],
            notices: [],
            rowCount: 0,
            rows: [],
          });
        });

        transformedStream.on('error', (error: Error) => {
          queryStream.destroy(error);
        });

        transformedStream.once('readable', () => {
          streamHandler(transformedStream);
        });
      });
    },
  );
};
