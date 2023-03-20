import { executeQuery } from '../routines';
import { type InternalCopyFromBinaryFunction } from '../types';
import { encodeTupleList } from '../utilities';
import { Duplex } from 'node:stream';
import { from } from 'pg-copy-streams';

const bufferToStream = (buffer: Buffer) => {
  const stream = new Duplex();

  stream.push(buffer);
  stream.push(null);

  return stream;
};

export const copyFromBinary: InternalCopyFromBinaryFunction = async (
  connectionLogger,
  connection,
  clientConfiguration,
  slonikSql,
  tupleList,
  columnTypes,
) => {
  const payloadBuffer = await encodeTupleList(tupleList, columnTypes);

  return await executeQuery(
    connectionLogger,
    connection,
    clientConfiguration,
    slonikSql,
    undefined,
    async (finalConnection, finalSql) => {
      const copyFromBinaryStream = finalConnection.query(from(finalSql));

      bufferToStream(payloadBuffer).pipe(copyFromBinaryStream);

      return await new Promise((resolve, reject) => {
        copyFromBinaryStream.on('error', (error: Error) => {
          reject(error);
        });

        copyFromBinaryStream.on('finish', () => {
          resolve({
            command: 'COPY',
            fields: [],
            notices: [],
            rowCount: 0,
            rows: [],
          });
        });
      });
    },
  );
};
