// @flow

import {
  Duplex,
} from 'stream';
import {
  from,
} from 'pg-copy-streams';
import {
  executeQuery,
} from '../routines';
import type {
  InternalCopyFromBinaryFunctionType,
} from '../types';
import {
  encodeTupleList,
} from '../utilities';

const bufferToStream = (buffer) => {
  const stream = new Duplex();

  stream.push(buffer);
  stream.push(null);

  return stream;
};

const copyFromBinary: InternalCopyFromBinaryFunctionType = async (
  connectionLogger,
  connection,
  clientConfiguration,
  rawSql,
  boundValues,
  tupleList,
  columnTypes,
) => {
  const payloadBuffer = await encodeTupleList(tupleList, columnTypes);

  return executeQuery(
    connectionLogger,
    connection,
    clientConfiguration,
    rawSql,
    boundValues,
    undefined,
    (finalConnection, finalSql) => {
      const copyFromBinaryStream = finalConnection.query(from(finalSql));

      bufferToStream(payloadBuffer).pipe(copyFromBinaryStream);

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
