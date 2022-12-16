import test from 'ava';
import {
  createClientConfiguration,
} from '../../../src/factories/createClientConfiguration';
import {
  createTypeParserPreset,
} from '../../../src/factories/createTypeParserPreset';

const defaultConfiguration = {
  captureStackTrace: false,
  connectionRetryLimit: 3,
  connectionTimeout: 5_000,
  idleInTransactionSessionTimeout: 60_000,
  idleTimeout: 5_000,
  interceptors: [],
  maximumPoolSize: 10,
  queryRetryLimit: 5,
  statementTimeout: 60_000,
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
