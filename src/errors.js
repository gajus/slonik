// @flow

import ExtendableError from 'es6-error';
import {
  createDebug
} from './factories';

const debug = createDebug('errors');

export class NotFoundError extends ExtendableError {
  constructor (message: string = 'Resource not found.') {
    debug(message);

    super(message);
  }
}

export class DataIntegrityError extends ExtendableError {}

export class DuplicateEntryError extends ExtendableError {
  code: string;

  constructor (message: string) {
    super(message);

    this.code = 'ER_DUP_ENTRY';
  }
}
