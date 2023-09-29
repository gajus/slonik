import { executeQuery } from '../routines/executeQuery';
import { type Interceptor, type InternalStreamFunction } from '../types';
import { type Readable, Transform } from 'node:stream';
import { type PoolClient } from 'pg';
import QueryStream from 'pg-query-stream';

type Field = {
  dataTypeId: number;
  name: string;
};

const getFields = (connection: PoolClient): Promise<readonly Field[]> => {
  return new Promise((resolve) => {
    // @ts-expect-error – https://github.com/brianc/node-postgres/issues/3015
    connection.connection.once('rowDescription', (rowDescription) => {
      resolve(
        rowDescription.fields.map((field) => {
          return {
            dataTypeId: field.dataTypeID,
            name: field.name,
          };
        }),
      );
    });
  });
};

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
      const streamEndResultRow = {
        command: 'SELECT',
        fields: [],
        notices: [],
        rowCount: 0,
        rows: [],
      } as const;

      const query = new QueryStream(
        finalSql,
        finalValues as unknown[],
        options,
      );

      const queryStream: Readable = finalConnection.query(query);

      const fields = await getFields(finalConnection);

      const rowTransformers: Array<NonNullable<Interceptor['transformRow']>> =
        [];

      for (const interceptor of clientConfiguration.interceptors) {
        if (interceptor.transformRow) {
          rowTransformers.push(interceptor.transformRow);
        }
      }

      return new Promise((resolve, reject) => {
        const transformStream = new Transform({
          objectMode: true,
          transform(datum, enc, callback) {
            let finalRow = datum;

            if (rowTransformers.length) {
              for (const rowTransformer of rowTransformers) {
                finalRow = rowTransformer(
                  executionContext,
                  actualQuery,
                  finalRow,
                  fields,
                );
              }
            }

            // eslint-disable-next-line @babel/no-invalid-this
            this.push({
              fields,
              row: finalRow,
            });

            callback();
          },
        });

        transformStream.on('newListener', (event) => {
          if (event === 'data') {
            queryStream.pipe(transformStream);
          }
        });

        transformStream.on('end', () => {
          resolve(streamEndResultRow);
        });

        transformStream.on('close', () => {
          if (!queryStream.destroyed) {
            queryStream.destroy();
          }

          resolve(streamEndResultRow);
        });

        transformStream.on('error', (error: Error) => {
          reject(error);

          queryStream.destroy(error);
        });

        queryStream.on('error', (error: Error) => {
          transformStream.destroy(error);
        });

        streamHandler(transformStream);
      });
    },
  );
};
