import type {
  PrimitiveValueExpression,
  Query,
  QueryResultRow,
} from '@slonik/types';
import type { StandardSchemaV1 } from '@standard-schema/spec';

type IntegrityConstraintViolationErrorCause = Error & {
  column?: string;
  constraint?: string;
  table?: string;
};

export class SlonikError extends Error {
  public override readonly cause?: Error;

  public readonly message: string;

  public constructor(message: string, options?: { cause?: Error }) {
    super(message);

    this.message = message || this.constructor.name;
    this.cause = options?.cause;
  }
}

export class BackendTerminatedError extends SlonikError {
  public constructor(error: Error) {
    super('Backend has been terminated.', { cause: error });
  }
}

export class BackendTerminatedUnexpectedlyError extends SlonikError {
  public constructor(error: Error) {
    super('Backend has been terminated unexpectedly.', { cause: error });
  }
}

export class IntegrityConstraintViolationError extends SlonikError {
  public column: null | string;

  public constraint: null | string;

  public table: null | string;

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

export class CheckExclusionConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super('Query violates a check exclusion constraint.', error);
  }
}

export class CheckIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super('Query violates a check integrity constraint.', error);
  }
}

export class ConnectionError extends SlonikError {}

export class DataIntegrityError extends SlonikError {
  public sql: string;

  public values: readonly PrimitiveValueExpression[];

  public constructor(query: Query) {
    super('Query returned an unexpected result.');

    this.sql = query.sql;
    this.values = query.values;
  }
}

export class ForeignKeyIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super('Query violates a foreign key integrity constraint.', error);
  }
}

export class IdleTransactionTimeoutError extends SlonikError {
  public constructor(error: Error) {
    super('Connection terminated due to idle-in-transaction timeout.', {
      cause: error,
    });
  }
}

export class InputSyntaxError extends SlonikError {
  public sql: string;

  public constructor(error: Error, query: Query) {
    super(error.message, {
      cause: error,
    });

    this.sql = query.sql;
  }
}

export class InvalidConfigurationError extends SlonikError {}

export class InvalidInputError extends SlonikError {}

export class NotFoundError extends SlonikError {
  public sql: string;

  public values: readonly PrimitiveValueExpression[];

  public constructor(query: Query) {
    super('Resource not found.');

    this.sql = query.sql;
    this.values = query.values;
  }
}

export class NotNullIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super('Query violates a not NULL integrity constraint.', error);
  }
}

export class SchemaValidationError extends SlonikError {
  public issues: readonly StandardSchemaV1.Issue[];

  public row: QueryResultRow;

  public sql: string;

  public values: readonly PrimitiveValueExpression[];

  public constructor(
    query: Query,
    row: QueryResultRow,
    issues: readonly StandardSchemaV1.Issue[],
  ) {
    super('Query returned rows that do not conform with the schema.');

    this.sql = query.sql;
    this.values = query.values;
    this.row = row;
    this.issues = issues;
  }
}

export class StatementCancelledError extends SlonikError {
  public constructor(error: Error) {
    super('Statement has been cancelled.', { cause: error });
  }
}

// @todo When does restrict_violation and exclusion_violation happen?
// @see https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html

export class StatementTimeoutError extends SlonikError {
  public constructor(error: Error) {
    super('Statement has been cancelled due to a statement_timeout.', {
      cause: error,
    });
  }
}

export class TupleMovedToAnotherPartitionError extends SlonikError {
  public constructor(error: Error) {
    super('Tuple moved to another partition due to concurrent update.', {
      cause: error,
    });
  }
}

export class UnexpectedForeignConnectionError extends SlonikError {
  public constructor() {
    super(
      'Cannot run a query inside a transaction using a foreign connection.',
    );
  }
}

export class UnexpectedStateError extends SlonikError {}

export class UniqueIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super('Query violates a unique integrity constraint.', error);
  }
}
