import {
  type PrimitiveValueExpression,
  type Query,
  type QueryResultRow,
} from './types';
import { type ZodIssue } from 'zod';

export class SlonikError extends Error {
  public readonly message: string;

  public readonly cause?: Error;

  public constructor(message: string, options?: { cause?: Error }) {
    super(message);

    this.message = message || this.constructor.name;
    this.cause = options?.cause;
  }
}

export class InvalidConfigurationError extends SlonikError {}

export class InvalidInputError extends SlonikError {}

export class InputSyntaxError extends SlonikError {
  public sql: string;

  public constructor(error: Error, query: Query) {
    super(error.message, {
      cause: error,
    });

    this.sql = query.sql;
  }
}

export class UnexpectedStateError extends SlonikError {}

export class ConnectionError extends SlonikError {}

export class StatementCancelledError extends SlonikError {
  public constructor(error: Error) {
    super('Statement has been cancelled.', { cause: error });
  }
}

export class StatementTimeoutError extends SlonikError {
  public constructor(error: Error) {
    super('Statement has been cancelled due to a statement_timeout.', {
      cause: error,
    });
  }
}

export class BackendTerminatedUnexpectedlyError extends SlonikError {
  public constructor(error: Error) {
    super('Backend has been terminated unexpectedly.', { cause: error });
  }
}

export class BackendTerminatedError extends SlonikError {
  public constructor(error: Error) {
    super('Backend has been terminated.', { cause: error });
  }
}

export class TupleMovedToAnotherPartitionError extends SlonikError {
  public constructor(error: Error) {
    super('Tuple moved to another partition due to concurrent update.', {
      cause: error,
    });
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
    super('Query returned an unexpected result.');

    this.sql = query.sql;
    this.values = query.values;
  }
}

export class SchemaValidationError extends SlonikError {
  public sql: string;

  public values: readonly PrimitiveValueExpression[];

  public row: QueryResultRow;

  public issues: ZodIssue[];

  public constructor(query: Query, row: QueryResultRow, issues: ZodIssue[]) {
    super('Query returned rows that do not conform with the schema.');

    this.sql = query.sql;
    this.values = query.values;
    this.row = row;
    this.issues = issues;
  }
}

type IntegrityConstraintViolationErrorCause = Error & {
  column?: string;
  constraint?: string;
  table?: string;
};

export class IntegrityConstraintViolationError extends SlonikError {
  public constraint: string | null;

  public column: string | null;

  public table: string | null;

  public cause?: Error;

  public constructor(
    message: string,
    error: IntegrityConstraintViolationErrorCause,
  ) {
    super(message, { cause: error });

    this.constraint = error.constraint ?? null;

    this.column = error.column ?? null;

    this.table = error.table ?? null;
  }
}

// @todo When does restrict_violation and exclusion_violation happen?
// @see https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html

export class NotNullIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super('Query violates a not NULL integrity constraint.', error);
  }
}

export class ForeignKeyIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super('Query violates a foreign key integrity constraint.', error);
  }
}

export class UniqueIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super('Query violates a unique integrity constraint.', error);
  }
}

export class CheckIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super('Query violates a check integrity constraint.', error);
  }
}
