// @flow

import camelcase from 'camelcase';
import type {
  FieldType,
  InterceptorType
} from '../types';

/**
 * @property format The only supported format is CAMEL_CASE.
 * @property test Tests whether the field should be formatted. The default behaviour is to include all fields that match ^[a-z0-9_]+$ regex.
 */
type ConfigurationType = {|
  +format: 'CAMEL_CASE',
  +test?: (field: FieldType) => boolean
|};

const underscoreFieldRegex = /^[a-z0-9_]+$/;

const underscoreFieldTest = (field: FieldType) => {
  return underscoreFieldRegex.test(field.name);
};

export default (configuration: ConfigurationType): InterceptorType => {
  if (configuration.format !== 'CAMEL_CASE') {
    throw new Error('Unsupported format.');
  }

  const fieldTest = configuration.test || underscoreFieldTest;

  return {
    afterQueryExecution: (context, query, result) => {
      const fieldNames = result.fields.map((field) => {
        return {
          formatted: fieldTest(field) ? camelcase(field.name) : field.name,
          original: field.name
        };
      });

      return {
        ...result,
        rows: result.rows.map((row) => {
          const newRow = {};

          for (const fieldName of fieldNames) {
            newRow[fieldName.formatted] = row[fieldName.original];
          }

          return newRow;
        })
      };
    }
  };
};
