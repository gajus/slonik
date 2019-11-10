// @flow

import Roarr from 'roarr';
import test, {
  beforeEach,
} from 'ava';
import executeQuery from '../../../src/routines/executeQuery';
import {
  InvalidInputError,
} from '../../../src/errors';
import createClientConfiguration from '../../helpers/createClientConfiguration';

const createConnectionStub = () => {
  return {
    connection: {
      slonik: {
        terminated: null,
      },
    },
  };
};

beforeEach((t) => {
  t.context.logger = Roarr;
  t.context.connection = createConnectionStub();
  t.context.executionRoutine = () => {};
});

test('throws a descriptive error if query is empty', async (t) => {
  const error = await t.throwsAsync(() => {
    return executeQuery(
      t.context.logger,
      t.context.connection,
      createClientConfiguration(),
      '',
      [],
      'foo',
      t.context.executionRoutine,
    );
  });

  t.assert(error instanceof InvalidInputError);
  t.assert(error.message === 'Unexpected SQL input. Query cannot be empty.');
});

test('throws a descriptive error if the entire query is a value binding', async (t) => {
  const error = await t.throwsAsync(() => {
    return executeQuery(
      t.context.logger,
      t.context.connection,
      createClientConfiguration(),
      '$1',
      [],
      'foo',
      t.context.executionRoutine,
    );
  });

  t.assert(error instanceof InvalidInputError);
  t.assert(error.message === 'Unexpected SQL input. Query cannot be empty. Found only value binding.');
});
