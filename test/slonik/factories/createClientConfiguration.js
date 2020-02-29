// @flow

import test from 'ava';
import Roarr from 'roarr';
import createClientConfiguration from '../../../src/factories/createClientConfiguration';
import createTypeParserPreset from '../../../src/factories/createTypeParserPreset';
import Logger from '../../../src/Logger';

const defaultConfiguration = {
  captureStackTrace: true,
  connectionRetryLimit: 3,
  connectionTimeout: 5000,
  idleInTransactionSessionTimeout: 60000,
  idleTimeout: 5000,
  interceptors: [],
  logger: Logger,
  maximumPoolSize: 10,
  preferNativeBindings: true,
  statementTimeout: 60000,
  transactionRetryLimit: 5,
  typeParsers: createTypeParserPreset(),
};

// createClientConfiguration builds a roarr logger - it's only meaningful to compare the value of `getContext`, though.
const compare = (t) => (...configs) => t.deepEqual(...configs.map(config => {
  return { ...config, logger: config.logger.getContext() };
}));

test('creates default configuration', (t) => {
  const configuration = createClientConfiguration();

  compare(t)(configuration, defaultConfiguration);
});

test('overrides provided properties', (t) => {
  compare(t)(
    createClientConfiguration({
      captureStackTrace: false,
    }),
    {
      ...defaultConfiguration,
      captureStackTrace: false,
    },
  );

  compare(t)(
    createClientConfiguration({
      interceptors: [
        // $FlowFixMe
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

  compare(t)(
    createClientConfiguration({
      typeParsers: [
        // $FlowFixMe
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
  compare(t)(
    createClientConfiguration({
      typeParsers: [],
    }),
    {
      ...defaultConfiguration,
      typeParsers: [],
    },
  );
});

test('extends input logger', (t) => {
  const customLogger = Roarr.child({ customTag: 'abc123' });
  compare(t)(
    createClientConfiguration({
      logger: customLogger
    }),
    {
      ...defaultConfiguration,
      logger: customLogger,
    }
  );
});
