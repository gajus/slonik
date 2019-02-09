// @flow

import test from 'ava';
import createQueryExecutionContext from '../helpers/createQueryExecutionContext';
import createQueryNormalizationInterceptor from '../../src/interceptors/createQueryNormalizationInterceptor';

test('strips comments from the query', async (t) => {
  const interceptor = createQueryNormalizationInterceptor({
    stripComments: true
  });

  const transformQuery = interceptor.transformQuery;

  if (!transformQuery) {
    throw new Error('Unexpected state.');
  }

  const query = await transformQuery(createQueryExecutionContext(), {
    sql: 'SELECT 1; --',
    values: []
  });

  t.deepEqual(query, {
    sql: 'SELECT 1;',
    values: []
  });
});
