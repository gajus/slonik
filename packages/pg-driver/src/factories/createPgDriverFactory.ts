/* eslint-disable canonical/id-match */

import { wrapError } from '../utilities/wrapError';
import { createClientConfiguration } from './createClientConfiguration';
import { createTypeOverrides, type TypeOverrides } from './createTypeOverrides';
import {
  createDriverFactory,
  type DriverCommand,
  type DriverConfiguration,
  type DriverFactory,
  type Field,
  type PrimitiveValueExpression,
} from '@slonik/internals';
import { Transform } from 'node:stream';
import {
  Client,
  type ClientConfig as NativePostgresClientConfiguration,
} from 'pg';
import QueryStream from 'pg-query-stream';

const queryTypeOverrides = async (
  pgClientConfiguration: NativePostgresClientConfiguration,
  driverConfiguration: DriverConfiguration,
): Promise<TypeOverrides> => {
  const client = new Client(pgClientConfiguration);

  await client.connect();

  const typeOverrides = await createTypeOverrides(
    client,
    driverConfiguration.typeParsers,
  );

  await client.end();

  return typeOverrides;
};

export const createPgDriverFactory = (): DriverFactory => {
  return createDriverFactory(async ({ driverConfiguration }) => {
    const clientConfiguration = createClientConfiguration(driverConfiguration);

    // eslint-disable-next-line require-atomic-updates
    clientConfiguration.types = {
      getTypeParser: await queryTypeOverrides(
        clientConfiguration,
        driverConfiguration,
      ),
    };

    return {
      createPoolClient: async ({ clientEventEmitter }) => {
        const client = new Client(clientConfiguration);

        // We will see this triggered when the connection is terminated, e.g.
        // "terminates transactions that are idle beyond idleInTransactionSessionTimeout" test.
        const onError = (error) => {
          clientEventEmitter.emit('error', wrapError(error, null));
        };

        const onNotice = (notice) => {
          if (notice.message) {
            clientEventEmitter.emit('notice', {
              message: notice.message,
            });
          }
        };

        client.on('error', onError);
        client.on('notice', onNotice);

        return {
          connect: async () => {
            await client.connect();
          },
          end: async () => {
            await client.end();

            client.removeListener('error', onError);
            client.removeListener('notice', onNotice);
          },
          query: async (sql, values) => {
            let result;

            try {
              result = await client.query(sql, values as unknown[]);
            } catch (error) {
              throw wrapError(error, {
                sql,
                values: values as readonly PrimitiveValueExpression[],
              });
            }

            return {
              command: result.command as DriverCommand,
              fields: result.fields.map((field) => {
                return {
                  dataTypeId: field.dataTypeID,
                  name: field.name,
                };
              }),
              rowCount: result.rowCount,
              rows: result.rows,
            };
          },
          stream: (sql, values) => {
            const stream = client.query(
              new QueryStream(sql, values as unknown[]),
            );

            let fields: readonly Field[] = [];

            // `rowDescription` will not fire if the query produces a syntax error.
            // Also, `rowDescription` won't fire until client starts consuming the stream.
            // This is why we cannot simply await for `rowDescription` event before starting to pipe the stream.
            // @ts-expect-error – https://github.com/brianc/node-postgres/issues/3015
            client.connection.once('rowDescription', (rowDescription) => {
              fields = rowDescription.fields.map((field) => {
                return {
                  dataTypeId: field.dataTypeID,
                  name: field.name,
                };
              });
            });

            const transform = new Transform({
              objectMode: true,
              async transform(datum, enc, callback) {
                if (!fields) {
                  callback(new Error('Fields not available'));

                  return;
                }

                // eslint-disable-next-line @babel/no-invalid-this
                this.push({
                  fields,
                  row: datum,
                });

                callback();
              },
            });

            stream.on('error', (error) => {
              transform.emit(
                'error',
                wrapError(error, {
                  sql,
                  values: values as PrimitiveValueExpression[],
                }),
              );
            });

            return stream.pipe(transform);
          },
        };
      },
    };
  });
};
