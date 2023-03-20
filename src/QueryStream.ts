/* eslint-disable canonical/id-match */

import { Readable, type ReadableOptions } from 'node:stream';
import { type QueryResult } from 'pg';
import Cursor from 'pg-cursor';

/**
 * @see https://github.com/brianc/node-pg-query-stream
 * @see https://github.com/brianc/node-pg-query-stream/issues/51
 */
export class QueryStream extends Readable {
  public _reading: boolean;

  public _closed: boolean;

  public _result: unknown;

  public cursor: typeof Cursor;

  public batchSize: number;

  public handleRowDescription: Function;

  public handlePortalSuspended: Function;

  public handleDataRow: Function;

  public handleCommandComplete: Function;

  public handleReadyForQuery: Function;

  public handleError: Function;

  public constructor(
    text: unknown,
    values: unknown,
    options?: ReadableOptions & { batchSize?: number },
  ) {
    super({
      objectMode: true,
      ...options,
    });
    this.cursor = new Cursor(text, values);
    this._reading = false;
    this._closed = false;
    this.batchSize = options?.batchSize ?? 100;

    // delegate Submittable callbacks to cursor
    this.handleRowDescription = this.cursor.handleRowDescription.bind(
      this.cursor,
    );
    this.handleDataRow = this.cursor.handleDataRow.bind(this.cursor);
    this.handlePortalSuspended = this.cursor.handlePortalSuspended.bind(
      this.cursor,
    );
    this.handleCommandComplete = this.cursor.handleCommandComplete.bind(
      this.cursor,
    );
    this.handleReadyForQuery = this.cursor.handleReadyForQuery.bind(
      this.cursor,
    );
    this.handleError = this.cursor.handleError.bind(this.cursor);

    // pg client sets types via _result property
    this._result = this.cursor._result;
  }

  public submit(connection: Object) {
    this.cursor.submit(connection);
  }

  public _destroy(error: Error, onDestroy: Function) {
    this._closed = true;

    this.cursor.close(() => {
      onDestroy(error);
    });
  }

  public _read(size: number) {
    if (this._reading || this._closed) {
      return;
    }

    this._reading = true;
    const readAmount = Math.max(size, this.batchSize);
    this.cursor.read(
      readAmount,
      (error: Error, rows: unknown[], result: QueryResult) => {
        if (this._closed) {
          return;
        }

        if (error) {
          this.destroy(error);

          return;
        }

        if (!rows.length) {
          this._closed = true;

          setImmediate(() => {
            this.emit('close');
          });

          this.push(null);

          return;
        }

        // push each row into the stream
        this._reading = false;

        for (const row of rows) {
          this.push({
            fields: (result.fields || []).map((field) => {
              return {
                dataTypeId: field.dataTypeID,
                name: field.name,
              };
            }),
            row,
          });
        }
      },
    );
  }
}
