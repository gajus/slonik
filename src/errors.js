// @flow

import ExtendableError from 'es6-error';

export class SlonikError extends ExtendableError {}

export class NotFoundError extends SlonikError {
  constructor (message: string = 'Resource not found.') {
    super(message);
  }
}

export class DataIntegrityError extends SlonikError {}

export class UniqueViolationError extends SlonikError {}
