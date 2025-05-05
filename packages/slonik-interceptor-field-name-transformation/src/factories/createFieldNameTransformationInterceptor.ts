import camelcase from 'camelcase';
import { type Field, type Interceptor, type QueryResultRow } from 'slonik';

export const createFieldNameTransformationInterceptor = ({
  test,
}: {
  test: (field: Field) => boolean;
}): Interceptor => {
  const cachedMappers = new Map<
    string,
    (row: Record<string, unknown>) => QueryResultRow
  >();

  return {
    name: 'slonik-interceptor-field-name-transformation',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformRow: (context: any, query, row, fields) => {
      let mapper = context.sandbox.mapper;

      if (!mapper) {
        const mapperKey = fields.map((field) => field.name).join(',');

        mapper = cachedMappers.get(mapperKey);

        if (!mapper) {
          // Create object with null prototype for slightly better performance
          const fieldMapping = Object.create(null);

          for (const field of fields) {
            fieldMapping[field.name] = test(field)
              ? camelcase(field.name)
              : field.name;
          }

          const keys = Object.keys(row);

          mapper = (currentRow: Record<string, unknown>) => {
            const result = Object.create(null);

            for (const key of keys) {
              result[fieldMapping[key]] = currentRow[key];
            }

            return result;
          };

          cachedMappers.set(mapperKey, mapper);
        }

        context.sandbox.mapper = mapper;
      }

      return mapper(row);
    },
  };
};
