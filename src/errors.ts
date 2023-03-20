import {
  type PrimitiveValueExpression,
  type Query,
  type SerializableValue,
} from './types';
import ExtendableError from 'es6-error';
import { type ZodIssue } from 'zod';

export class SlonikError extends ExtendableError {}

export class WrappedPGError extends SlonikError {
  public readonly message!: string;

  public readonly originalError: Error;

  public constructor(originalError: Error, message: string) {
    super(`${message} ${originalError.message}`);

    this.originalError = originalError;
  }
}

export class InvalidConfigurationError extends SlonikError {}

export class InvalidInputError extends SlonikError {}

export class UnexpectedStateError extends SlonikError {}

export class ConnectionError extends SlonikError {}

export class StatementCancelledError extends WrappedPGError {
  public constructor(error: Error, message = 'Statement has been cancelled.') {
    super(error, message);
  }
}

export class StatementTimeoutError extends StatementCancelledError {
  public constructor(error: Error) {
    super(error, 'Statement has been cancelled due to a statement_timeout.');
  }
}

export class BackendTerminatedError extends WrappedPGError {
  public constructor(error: Error) {
    super(error, 'Backend has been terminated.');
  }
}

export class TupleMovedToAnotherPartitionError extends WrappedPGError {
  public constructor(
    error: Error,
    message = 'Tuple moved to another partition due to concurrent update.',
  ) {
    super(error, message);
  }
}

export class NotFoundError extends SlonikError {
  public sql: string;

  public values: readonly PrimitiveValueExpression[];

  public constructor(query: Query) {
    super('Resource not found.');

    this.sql = query.sql;
    this.values = query.values;
  }
}

export class DataIntegrityError extends SlonikError {
  public sql: string;

  public values: readonly PrimitiveValueExpression[];

  public constructor(query: Query) {
    super('Query returns an unexpected result.');

    this.sql = query.sql;
    this.values = query.values;
  }
}

export class SchemaValidationError extends SlonikError {
  public sql: string;

  public values: readonly PrimitiveValueExpression[];

  public row: SerializableValue;

  public issues: ZodIssue[];

  public constructor(query: Query, row: SerializableValue, issues: ZodIssue[]) {
    super('Query returned rows that do not conform with the schema.');

    this.sql = query.sql;
    this.values = query.values;
    this.row = row;
    this.issues = issues;
  }
}

export class IntegrityConstraintViolationError extends WrappedPGError {
  public constraint: string;

  public constructor(
    error: Error,
    constraint: string,
    message = 'Query violates an integrity constraint.',
  ) {
    super(error, message);

    this.constraint = constraint;
  }
}

// @todo When does restrict_violation and exclusion_violation happen?
// @see https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html

export class NotNullIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: Error, constraint: string) {
    super(error, constraint, 'Query violates a not NULL integrity constraint.');
  }
}

export class ForeignKeyIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: Error, constraint: string) {
    super(
      error,
      constraint,
      'Query violates a foreign key integrity constraint.',
    );
  }
}

export class UniqueIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: Error, constraint: string) {
    super(error, constraint, 'Query violates a unique integrity constraint.');
  }
}

export class CheckIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: Error, constraint: string) {
    super(error, constraint, 'Query violates a check integrity constraint.');
  }
}
