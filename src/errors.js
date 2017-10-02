// @flow

import ExtendableError from 'es6-error';

export class NotFoundError extends ExtendableError {
  constructor (message: string = 'Resource not found.') {
    super(message);
  }
}

export class DataIntegrityError extends ExtendableError {}

export class UniqueViolationError extends ExtendableError {}
