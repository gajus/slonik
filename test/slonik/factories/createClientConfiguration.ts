// @flow

import test from 'ava';
import {
  createClientConfiguration,
} from '../../../src/factories/createClientConfiguration';
import {
  createTypeParserPreset,
} from '../../../src/factories/createTypeParserPreset';

const defaultConfiguration = {
  captureStackTrace: true,
  connectionRetryLimit: 3,
  connectionTimeout: 5000,
  idleInTransactionSessionTimeout: 60000,
  idleTimeout: 5000,
  interceptors: [],
  maximumPoolSize: 10,
  preferNativeBindings: true,
  statementTimeout: 60000,
  transactionRetryLimit: 5,
  typeParsers: createTypeParserPreset(),
};

test('creates default configuration', (t) => {
  const configuration = createClientConfiguration();

  t.deepEqual(configuration, defaultConfiguration);
});

test('overrides provided properties', (t) => {
  t.deepEqual(
    createClientConfiguration({
      captureStackTrace: false,
    }),
    {
      ...defaultConfiguration,
      captureStackTrace: false,
    },
  );

  t.deepEqual(
    createClientConfiguration({
      interceptors: [
        // @ts-expect-error
        'foo',
      ],
    }),
    {
      ...defaultConfiguration,
      interceptors: [
        // @ts-expect-error
        'foo',
      ],
    },
  );

  t.deepEqual(
    createClientConfiguration({
      typeParsers: [
        // @ts-expect-error
        'foo',
      ],
    }),
    {
      ...defaultConfiguration,
      typeParsers: [
        // @ts-expect-error
        'foo',
      ],
    },
  );
});

test('disables default type parsers', (t) => {
  t.deepEqual(
    createClientConfiguration({
      typeParsers: [],
    }),
    {
      ...defaultConfiguration,
      typeParsers: [],
    },
  );
});
