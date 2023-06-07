import {
  IntegrityConstraintViolationError,
  StatementCancelledError,
} from '../../src/errors';
import test from 'ava';

test('IntegrityConstraintViolationError default message', (t) => {
  t.is(
    new IntegrityConstraintViolationError(
      new Error('original error message'),
      'test-constraint',
    ).message,
    'Query violates an integrity constraint. original error message',
  );
});

test('StatementCancelledError default message', (t) => {
  t.is(
    new StatementCancelledError(new Error('original error message')).message,
    'Statement has been cancelled. original error message',
  );
});
