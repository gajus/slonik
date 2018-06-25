// @flow

import ExtendableError from 'es6-error';

export class SlonikError extends ExtendableError {}

export class NotFoundError extends SlonikError {
  constructor () {
    super('Resource not found.');
  }
}

export class DataIntegrityError extends SlonikError {
  constructor () {
    super('Query returns an unexpected result.');
  }
}

export class UniqueViolationError extends SlonikError {
  constraint: string;

  constructor (constraint: string) {
    super('Query violates a unique constraint.');

    this.constraint = constraint;
  }
}
