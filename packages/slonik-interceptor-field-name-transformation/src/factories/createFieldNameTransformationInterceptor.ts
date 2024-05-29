import camelcase from 'camelcase';
import { type Field, type Interceptor } from 'slonik';

/**
 * @property format The only supported format is CAMEL_CASE.
 * @property test Tests whether the field should be formatted. The default behavior is to include all fields that match ^[a-z0-9_]+$ regex.
 */
type Configuration = {
  format: 'CAMEL_CASE';
  test?: (field: Field) => boolean;
};

const underscoreFieldRegex = /^[a-z\d_]+$/u;

const underscoreFieldTest = (field: Field) => {
  return underscoreFieldRegex.test(field.name);
};

export const createFieldNameTransformationInterceptor = (
  configuration: Configuration,
): Interceptor => {
  if (configuration.format !== 'CAMEL_CASE') {
    throw new Error('Unsupported format.');
  }

  const fieldTest = configuration.test ?? underscoreFieldTest;

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformRow: (context: any, query, row, fields) => {
      if (!context.sandbox.formattedFields) {
        context.sandbox.formattedFields = [];

        for (const field of fields) {
          context.sandbox.formattedFields.push({
            formatted: fieldTest(field) ? camelcase(field.name) : field.name,
            original: field.name,
          });
        }
      }

      const { formattedFields } = context.sandbox;

      const transformedRow = {};

      for (const field of formattedFields) {
        if (typeof field.formatted !== 'string') {
          throw new TypeError('Unexpected field name type.');
        }

        transformedRow[field.formatted] = row[field.original];
      }

      return transformedRow;
    },
  };
};
