// @flow

import {
  Readable,
} from 'stream';
import createConcatStream from 'concat-stream';
import {
  deparser as createEncoder,
} from 'pg-copy-streams-binary';
import type {
  TypeNameIdentifierType,
} from '../types';

export const encodeTupleList = (
  tupleList: ReadonlyArray<ReadonlyArray<unknown>>,
  columnTypes: ReadonlyArray<TypeNameIdentifierType>,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const concatStream = createConcatStream((payloadBuffer) => {
      resolve(payloadBuffer);
    });

    const encode = createEncoder();

    const tupleStream = new Readable({
      objectMode: true,
    });

    tupleStream
      .pipe(encode)
      .pipe(concatStream)
      .on('error', (error: Error) => {
        reject(error);
      });

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

      tupleStream.push(payload);
    }

    tupleStream.push(null);
  });
};
