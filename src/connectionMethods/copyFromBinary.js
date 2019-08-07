// @flow

import {
  Readable,
} from 'stream';
import {
  from,
} from 'pg-copy-streams';
import {
  deparser,
} from 'pg-copy-streams-binary';
import {
  executeQuery,
} from '../routines';
import type {
  InternalCopyFromBinaryFunctionType,
} from '../types';

const copyFromBinary: InternalCopyFromBinaryFunctionType = async (
  connectionLogger,
  connection,
  clientConfiguration,
  rawSql,
  boundValues,
  tupleList,
  columnTypes,
) => {
  return executeQuery(
    connectionLogger,
    connection,
    clientConfiguration,
    rawSql,
    boundValues,
    undefined,
    (finalConnection, finalSql) => {
      const copyFromBinaryStream = finalConnection.query(from(finalSql));

      const tupleStream = new Readable({
        objectMode: true,
      });

      tupleStream
        .pipe(deparser())
        .pipe(copyFromBinaryStream);

      let lastTupleSize;

      for (const tuple of tupleList) {
        if (typeof lastTupleSize === 'number' && lastTupleSize !== tuple.length) {
          throw new Error('Each tuple in a list of tuples must have an equal number of members.');
        }

        if (tuple.length !== columnTypes.length) {
          throw new Error('Column types length must match tuple member length.');
        }

        lastTupleSize = tuple.length;

        const payload = new Array(lastTupleSize);

        let tupleColumnIndex = -1;

        while (tupleColumnIndex++ < lastTupleSize - 1) {
          payload[tupleColumnIndex] = {
            type: columnTypes[tupleColumnIndex],
            value: tuple[tupleColumnIndex],
          };
        }

        // $FlowFixMe
        tupleStream.push(payload);
      }

      tupleStream.push(null);

      return new Promise((resolve, reject) => {
        copyFromBinaryStream.on('error', (error) => {
          reject(error);
        });

        copyFromBinaryStream.on('end', () => {
          // $FlowFixMe
          resolve({});
        });
      });
    }
  );
};

export default copyFromBinary;
