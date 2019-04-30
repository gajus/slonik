// @flow

import through from 'through2';
import {
  executeQuery
} from '../routines';
import type {
  InternalStreamFunctionType
} from '../types';
import QueryStream from '../QueryStream';

const stream: InternalStreamFunctionType = async (connectionLogger, connection, clientConfiguration, rawSql, values, streamHandler) => {
  return executeQuery(
    connectionLogger,
    connection,
    clientConfiguration,
    rawSql,
    values,
    undefined,
    (finalConnection, finsalSql, finalValues, executionContext, actualQuery) => {
      const query = new QueryStream(finsalSql, finalValues);

      const queryStream = finalConnection.query(query);

      const rowTransformers = [];

      for (const interceptor of clientConfiguration.interceptors) {
        if (interceptor.transformRow) {
          rowTransformers.push(interceptor.transformRow);
        }
      }

      return new Promise((resolve, reject) => {
        queryStream.on('error', (error) => {
          reject(error);
        });

        const transformedStream = queryStream.pipe(through.obj(function (datum, enc, callback) {
          let finalRow = datum.row;

          if (rowTransformers.length) {
            for (const rowTransformer of rowTransformers) {
              finalRow = rowTransformer(executionContext, actualQuery, finalRow, datum.fields);
            }
          }

          // eslint-disable-next-line fp/no-this, babel/no-invalid-this
          this.push({
            fields: datum.fields,
            row: finalRow
          });

          callback();
        }));

        transformedStream.on('end', () => {
          // $FlowFixMe
          resolve({});
        });

        // Invoked if stream is destroyed using transformedStream.destroy().
        transformedStream.on('close', () => {
          // $FlowFixMe
          resolve({});
        });

        streamHandler(transformedStream);
      });
    }
  );
};

export default stream;
