import {
  BackendTerminatedError,
  BackendTerminatedUnexpectedlyError,
  CheckIntegrityConstraintViolationError,
  ForeignKeyIntegrityConstraintViolationError,
  IdleTransactionTimeoutError,
  InputSyntaxError,
  InvalidInputError,
  NotNullIntegrityConstraintViolationError,
  StatementCancelledError,
  StatementTimeoutError,
  UnexpectedStateError,
  UniqueIntegrityConstraintViolationError,
} from '@slonik/internals';
import { type DatabaseError } from 'pg';

const isErrorWithCode = (error: Error): error is DatabaseError => {
  return 'code' in error;
};

// query is not available for connection-level errors.
// TODO evaluate if we can remove query from the error object.
// I suspect we should not be even using InputSyntaxError as one of the error types.
// @see https://github.com/gajus/slonik/issues/557
export const wrapError = (error: Error, query: Query | null) => {
  if (
    error.message.toLowerCase().includes('connection terminated unexpectedly')
  ) {
    return new BackendTerminatedUnexpectedlyError(error);
  }

  if (error.message.toLowerCase().includes('connection terminated')) {
    return new BackendTerminatedError(error);
  }

  if (!isErrorWithCode(error)) {
    return error;
  }

  if (error.code === '22P02') {
    return new InvalidInputError(error.message);
  }

  if (error.code === '25P03') {
    return new IdleTransactionTimeoutError(error);
  }

  if (error.code === '57P01') {
    return new BackendTerminatedError(error);
  }

  if (
    error.code === '57014' &&
    // The code alone is not enough to distinguish between a statement timeout and a statement cancellation.
    error.message.includes('canceling statement due to user request')
  ) {
    return new StatementCancelledError(error);
  }

  if (error.code === '57014') {
    return new StatementTimeoutError(error);
  }

  if (error.code === '23502') {
    return new NotNullIntegrityConstraintViolationError(error);
  }

  if (error.code === '23503') {
    return new ForeignKeyIntegrityConstraintViolationError(error);
  }

  if (error.code === '23505') {
    return new UniqueIntegrityConstraintViolationError(error);
  }

  if (error.code === '23514') {
    return new CheckIntegrityConstraintViolationError(error);
  }

  if (error.code === '42601') {
    if (!query) {
      return new UnexpectedStateError('Expected query to be provided');
    }

    return new InputSyntaxError(error, query);
  }

  return error;
};
