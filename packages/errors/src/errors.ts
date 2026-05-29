import type { PrimitiveValueExpression, Query, QueryResultRow } from "@slonik/types";
import type { StandardSchemaV1 } from "@standard-schema/spec";

type IntegrityConstraintViolationErrorCause = Error & {
  column?: string;
  constraint?: string;
  detail?: string;
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
    super("Backend has been terminated.", { cause: error });
  }
}

export class BackendTerminatedUnexpectedlyError extends SlonikError {
  public constructor(error: Error) {
    super("Backend has been terminated unexpectedly.", { cause: error });
  }
}

const INDEX_VALUE_DESCRIPTION_PATTERN = /\(([^)]+)\)=\(/u;

/**
 * Postgres only populates the wire-protocol `column` field for not-NULL
 * violations (23502). For unique (23505) and foreign key (23503) violations the
 * offending column(s) are described only inside the `detail` string, e.g.
 * `Key (email)=(foo@bar.com) already exists.`. We extract the column list from
 * the leading `(columns)=(values)` descriptor, which Postgres emits verbatim
 * regardless of `lc_messages` (only the surrounding prose is localized).
 * Expression and partial index columns are intentionally not extracted – the
 * array is left empty rather than reporting a partial or misleading name.
 */
const parseIntegrityConstraintViolationColumns = (
  error: IntegrityConstraintViolationErrorCause,
): readonly string[] => {
  if (error.column) {
    return [error.column];
  }

  const indexValueDescription = error.detail?.match(INDEX_VALUE_DESCRIPTION_PATTERN);

  if (!indexValueDescription) {
    return [];
  }

  return indexValueDescription[1].split(",").map((column) => column.trim());
};

export class IntegrityConstraintViolationError extends SlonikError {
  public column: null | string;

  public columns: readonly string[];

  public constraint: null | string;

  public detail: null | string;

  public table: null | string;

  public constructor(message: string, error: IntegrityConstraintViolationErrorCause) {
    super(message, { cause: error });

    this.constraint = error.constraint ?? null;

    this.column = error.column ?? null;

    this.columns = parseIntegrityConstraintViolationColumns(error);

    this.detail = error.detail ?? null;

    this.table = error.table ?? null;
  }
}

export class CheckExclusionConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super("Query violates a check exclusion constraint.", error);
  }
}

export class CheckIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super("Query violates a check integrity constraint.", error);
  }
}

export class ConnectionError extends SlonikError {}

export class DataIntegrityError extends SlonikError {
  public sql: string;

  public values: readonly PrimitiveValueExpression[];

  public constructor(message: string, query: Query) {
    super(message);

    this.sql = query.sql;
    this.values = query.values;
  }
}

export class ForeignKeyIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super("Query violates a foreign key integrity constraint.", error);
  }
}

export class IdleTransactionTimeoutError extends SlonikError {
  public constructor(error: Error) {
    super("Connection terminated due to idle-in-transaction timeout.", {
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

export class NotFoundError extends DataIntegrityError {}

export class NotNullIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super("Query violates a not NULL integrity constraint.", error);
  }
}

export class SchemaValidationError extends SlonikError {
  public issues: readonly StandardSchemaV1.Issue[];

  public row: QueryResultRow;

  public sql: string;

  public values: readonly PrimitiveValueExpression[];

  public constructor(query: Query, row: QueryResultRow, issues: readonly StandardSchemaV1.Issue[]) {
    super("Query returned rows that do not conform with the schema.");

    this.sql = query.sql;
    this.values = query.values;
    this.row = row;
    this.issues = issues;
  }
}

export class StatementCancelledError extends SlonikError {
  public constructor(error: Error) {
    super("Statement has been cancelled.", { cause: error });
  }
}

// @todo When does restrict_violation and exclusion_violation happen?
// @see https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html

export class StatementTimeoutError extends SlonikError {
  public constructor(error: Error) {
    super("Statement has been cancelled due to a statement_timeout.", {
      cause: error,
    });
  }
}

export class TupleMovedToAnotherPartitionError extends SlonikError {
  public constructor(error: Error) {
    super("Tuple moved to another partition due to concurrent update.", {
      cause: error,
    });
  }
}

export class UnexpectedForeignConnectionError extends SlonikError {
  public constructor() {
    super("Cannot run a query inside a transaction using a foreign connection.");
  }
}

export class UnexpectedStateError extends SlonikError {}

export class UniqueIntegrityConstraintViolationError extends IntegrityConstraintViolationError {
  public constructor(error: IntegrityConstraintViolationErrorCause) {
    super("Query violates a unique integrity constraint.", error);
  }
}
