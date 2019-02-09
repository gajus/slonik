// @flow

import test from 'ava';
import createQueryExecutionContext from '../helpers/createQueryExecutionContext';
import createFieldNameTransformationInterceptor from '../../src/interceptors/createFieldNameTransformationInterceptor';

test('changes field names to camelcase', (t) => {
  const interceptor = createFieldNameTransformationInterceptor({
    format: 'CAMEL_CASE'
  });

  const afterQueryExecution = interceptor.afterQueryExecution;

  if (!afterQueryExecution) {
    throw new Error('Unexpected state.');
  }

  const result = afterQueryExecution(
    createQueryExecutionContext(),
    {
      sql: 'SELECT 1'
    },
    {
      command: 'SELECT',
      fields: [
        {
          columnID: 1,
          dataTypeID: 1,
          dataTypeModifier: 1,
          dataTypeSize: 1,
          format: '',
          name: 'foo_bar',
          tableID: 1
        }
      ],
      oid: null,
      rowAsArray: false,
      rowCount: 1,
      rows: [
        {
          foo_bar: 1
        }
      ]
    }
  );

  t.deepEqual(result, {
    command: 'SELECT',
    fields: [
      {
        columnID: 1,
        dataTypeID: 1,
        dataTypeModifier: 1,
        dataTypeSize: 1,
        format: '',
        name: 'foo_bar',
        tableID: 1
      }
    ],
    oid: null,
    rowAsArray: false,
    rowCount: 1,
    rows: [
      {
        fooBar: 1
      }
    ]
  });
});
