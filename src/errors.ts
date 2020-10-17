// @flow

/* eslint-disable fp/no-class, fp/no-this */

import ExtendableError from 'es6-error';

export class SlonikError extends ExtendableError {
  originalError: Error
}

export class InvalidConfigurationError extends SlonikError {}

export class InvalidInputError extends SlonikError {}

export class UnexpectedStateError extends SlonikError {}

export class ConnectionError extends SlonikError {}

export class StatementCancelledError extends SlonikError {
  constructor (error: Error) {
    super();

    this.originalError = error;
    this.message = 'Statement has been cancelled.';
  }
}

export class StatementTimeoutError extends StatementCancelledError {
  constructor (error: Error) {
    super(error);

    this.message = 'Statement has been cancelled due to a statement_timeout.';
  }
}

export class BackendTerminatedError extends SlonikError {
  constructor (error: Error) {
    super();

    this.originalError = error;
    this.message = 'Backend has been terminated.';
  }
}

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

export class IntegrityConstraintViolationError extends SlonikError {
  constraint: string;

  constructor (error: Error, constraint: string) {
    super();

    this.originalError = error;
    this.constraint = constraint;
  }
}

// @todo When does restrict_violation and exclusion_violation happen?
// @see https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html

export class NotNullIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  constructor (error: Error, constraint: string) {
    super(error, constraint);

    this.originalError = error;
    this.message = 'Query violates a not NULL integrity constraint.';
  }
}

export class ForeignKeyIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  constructor (error: Error, constraint: string) {
    super(error, constraint);

    this.originalError = error;
    this.message = 'Query violates a foreign key integrity constraint.';
  }
}

export class UniqueIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  constructor (error: Error, constraint: string) {
    super(error, constraint);

    this.originalError = error;
    this.message = 'Query violates a unique integrity constraint.';
  }
}

export class CheckIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  constructor (error: Error, constraint: string) {
    super(error, constraint);

    this.originalError = error;
    this.message = 'Query violates a check integrity constraint.';
  }
}
