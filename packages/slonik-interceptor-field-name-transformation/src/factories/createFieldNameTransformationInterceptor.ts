import camelcase from "camelcase";
import type { Field, Interceptor, QueryResultRow } from "slonik";

type RowMapper = (row: QueryResultRow) => QueryResultRow;

/**
 * [Row field name, transformed field name] pairs, in the order of the row's fields.
 */
type FieldNames = ReadonlyArray<readonly [string, string]>;

// Used for sets of fields whose names do not need to be transformed.
const passthroughRowMapper: RowMapper = (row) => {
  return row;
};

/**
 * Compiles a function that copies a row into an object literal with the transformed field names.
 * V8 allocates an object literal with all of its properties in a single step and in a fixed shape
 * ("fast properties"), which is much cheaper to create and to read than an object that is
 * assembled one property at a time.
 */
const compileRowMapper = (fieldNames: FieldNames): RowMapper => {
  const properties = fieldNames.map(([name, transformedName]) => {
    // The field names are embedded as JSON string literals, so they cannot inject code.
    // A literal `"__proto__": value` property would set the prototype; a computed key does not.
    const key =
      transformedName === "__proto__"
        ? "[" + JSON.stringify(transformedName) + "]"
        : JSON.stringify(transformedName);

    return key + ":row[" + JSON.stringify(name) + "]";
  });

  // oxlint-disable-next-line no-new-func
  return new Function("row", "return {" + properties.join(",") + "};") as RowMapper;
};

// Used where code generation from strings is not allowed.
const createRowMapper = (fieldNames: FieldNames): RowMapper => {
  return (row) => {
    const result: QueryResultRow = {};

    for (const [name, transformedName] of fieldNames) {
      if (transformedName === "__proto__") {
        Object.defineProperty(result, transformedName, {
          configurable: true,
          enumerable: true,
          value: row[name],
          writable: true,
        });
      } else {
        result[transformedName] = row[name];
      }
    }

    return result;
  };
};

const createRowMapperForFields = (
  row: QueryResultRow,
  fields: readonly Field[],
  test: (field: Field) => boolean,
): RowMapper => {
  const transformedNames = new Map<string, string>();

  for (const field of fields) {
    transformedNames.set(field.name, test(field) ? camelcase(field.name) : field.name);
  }

  const fieldNames: FieldNames = Object.keys(row).map((name): readonly [string, string] => {
    return [name, transformedNames.get(name) ?? name];
  });

  if (
    fieldNames.every(([name, transformedName]) => {
      return name === transformedName;
    })
  ) {
    return passthroughRowMapper;
  }

  try {
    return compileRowMapper(fieldNames);
  } catch {
    return createRowMapper(fieldNames);
  }
};

export const createFieldNameTransformationInterceptor = ({
  test,
}: {
  test: (field: Field) => boolean;
}): Interceptor => {
  // Row mappers are created once per set of fields and reused for every row of every query that
  // produces the same set of fields.
  const rowMappers = new Map<string, RowMapper>();

  return {
    name: "slonik-interceptor-field-name-transformation",
    transformRow: (context, query, row, fields) => {
      let rowMapper = context.sandbox.fieldNameTransformationRowMapper as RowMapper | undefined;

      if (!rowMapper) {
        // `test` receives the whole field, so the key includes the field types. Field names cannot
        // contain the NUL character, which makes the key unambiguous.
        const key = fields
          .map((field) => {
            return field.name + ":" + String(field.dataTypeId);
          })
          .join("\u0000");

        rowMapper = rowMappers.get(key);

        if (!rowMapper) {
          rowMapper = createRowMapperForFields(row, fields, test);

          rowMappers.set(key, rowMapper);
        }

        context.sandbox.fieldNameTransformationRowMapper = rowMapper;
      }

      return rowMapper(row);
    },
  };
};
