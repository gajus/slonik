// @flow

/* eslint-disable fp/no-class, fp/no-this, id-match, flowtype/no-weak-types */

import {
  Readable
} from 'stream';
import Cursor from 'pg-cursor';

/**
 * @see https://github.com/brianc/node-pg-query-stream
 * @see https://github.com/brianc/node-pg-query-stream/issues/51
 */
export default class QueryStream extends Readable {
  _reading: boolean;

  _closed: boolean;

  cursor: Cursor;

  batchSize: number;

  handleRowDescription: Function;

  handlePortalSuspended: Function;

  handleDataRow: Function;

  handlePortalSuspended: Function;

  handleCommandComplete: Function;

  handleReadyForQuery: Function;

  handleError: Function;

  // $FlowFixMe
  constructor (text, values, options) {
    super({
      objectMode: true,
      ...options
    });
    this.cursor = new Cursor(text, values);
    this._reading = false;
    this._closed = false;
    this.batchSize = (options || {}).batchSize || 100;

    // delegate Submittable callbacks to cursor
    this.handleRowDescription = this.cursor.handleRowDescription.bind(this.cursor);
    this.handleDataRow = this.cursor.handleDataRow.bind(this.cursor);
    this.handlePortalSuspended = this.cursor.handlePortalSuspended.bind(this.cursor);
    this.handleCommandComplete = this.cursor.handleCommandComplete.bind(this.cursor);
    this.handleReadyForQuery = this.cursor.handleReadyForQuery.bind(this.cursor);
    this.handleError = this.cursor.handleError.bind(this.cursor);
  }

  submit (connection: Object) {
    this.cursor.submit(connection);
  }

  close (callback: Function) {
    this._closed = true;

    const close = () => {
      this.emit('close');
    };

    this.cursor.close(callback || close);
  }

  // $FlowFixMe
  _read (size: number) {
    if (this._reading || this._closed) {
      return;
    }
    this._reading = true;
    const readAmount = Math.max(size, this.batchSize);
    this.cursor.read(readAmount, (error, rows, result) => {
      if (this._closed) {
        return;
      }

      if (error) {
        this.emit('error', error);

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
        // $FlowFixMe
        this.push({
          fields: result.fields,
          row
        });
      }
    });
  }
}
