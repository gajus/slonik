import { createFieldNameTransformationInterceptor } from "./createFieldNameTransformationInterceptor.js";
import test from "ava";
import type { Field, QueryContext, QueryResultRow } from "slonik";

const createQueryContext = (): QueryContext => {
  return {
    connectionId: "1",
    log: {
      getContext: () => {
        return {
          connectionId: "1",
          poolId: "1",
        };
      },
    },
    poolId: "1",
    sandbox: {},
  } as unknown as QueryContext;
};

const createFields = (names: readonly string[], dataTypeId = 25): Field[] => {
  return names.map((name) => {
    return {
      dataTypeId,
      name,
    };
  });
};

const createTransformRow = (isTransformed: (field: Field) => boolean) => {
  const { transformRow } = createFieldNameTransformationInterceptor({
    test: isTransformed,
  });

  if (!transformRow) {
    throw new Error("Unexpected state.");
  }

  // Each call simulates a new query.
  return (row: QueryResultRow, fields: readonly Field[]) => {
    return transformRow(
      createQueryContext(),
      {
        sql: "SELECT 1",
        values: [],
      },
      row,
      fields,
    );
  };
};

const isSnakeCase = (field: Field) => {
  return /^[\d_a-z]+$/u.test(field.name);
};

test("transforms field names to camelcase", (t) => {
  const transformRow = createTransformRow(isSnakeCase);

  t.deepEqual(transformRow({ foo_bar: 1 }, createFields(["foo_bar"])), {
    fooBar: 1,
  });
});

test("does not transform fields that do not pass the test", (t) => {
  const transformRow = createTransformRow((field) => {
    return field.name !== "__typename" && isSnakeCase(field);
  });

  t.deepEqual(
    transformRow(
      { __typename: "person", full_name: "John Doe", id: 1 },
      createFields(["id", "full_name", "__typename"]),
    ),
    {
      __typename: "person",
      fullName: "John Doe",
      id: 1,
    },
  );
});

test("produces plain objects", (t) => {
  const transformRow = createTransformRow(isSnakeCase);

  const result = transformRow({ foo_bar: 1 }, createFields(["foo_bar"]));

  t.is(Object.getPrototypeOf(result), Object.prototype);
});

test("returns the row as it is when no field name needs to be transformed", (t) => {
  const transformRow = createTransformRow(isSnakeCase);

  const row = { foo: 1 };

  t.is(transformRow(row, createFields(["foo"])), row);
});

test("defines a __proto__ field as a property instead of setting the prototype", (t) => {
  const transformRow = createTransformRow((field) => {
    return field.name !== "__proto__" && isSnakeCase(field);
  });

  const row = JSON.parse('{"__proto__": {"polluted": true}, "foo_bar": 1}');

  const result = transformRow(row, createFields(["__proto__", "foo_bar"]));

  t.is(Object.getPrototypeOf(result), Object.prototype);
  t.deepEqual(Object.keys(result), ["__proto__", "fooBar"]);
  t.deepEqual(Object.getOwnPropertyDescriptor(result, "__proto__")?.value, { polluted: true });
});

test("handles field names that contain special characters", (t) => {
  const transformRow = createTransformRow(isSnakeCase);

  const names = [
    "foo_bar",
    'a"b',
    "c\\d",
    "e\nf",
    "g\u2028h",
    '"]; throw new Error("injected"); //',
  ];

  const result = transformRow(
    Object.fromEntries(
      names.map((name, index) => {
        return [name, index];
      }),
    ),
    createFields(names),
  );

  t.deepEqual(result, {
    '"]; throw new Error("injected"); //': 5,
    'a"b': 1,
    "c\\d": 2,
    "e\nf": 3,
    fooBar: 0,
    "g\u2028h": 4,
  });
});

test("does not reuse the mapping of fields whose names join to the same string", (t) => {
  const transformRow = createTransformRow(isSnakeCase);

  t.deepEqual(transformRow({ "foo_bar,baz_qux": 1 }, createFields(["foo_bar,baz_qux"])), {
    "foo_bar,baz_qux": 1,
  });

  t.deepEqual(transformRow({ baz_qux: 2, foo_bar: 1 }, createFields(["foo_bar", "baz_qux"])), {
    bazQux: 2,
    fooBar: 1,
  });
});

test("does not reuse the mapping of fields with the same names but different types", (t) => {
  const transformRow = createTransformRow((field) => {
    return field.dataTypeId === 25;
  });

  t.deepEqual(transformRow({ foo_bar: "a" }, createFields(["foo_bar"], 25)), {
    fooBar: "a",
  });

  t.deepEqual(transformRow({ foo_bar: 1 }, createFields(["foo_bar"], 23)), {
    foo_bar: 1,
  });
});

test("tests the fields once per set of fields", (t) => {
  let calls = 0;

  const transformRow = createTransformRow((field) => {
    calls++;

    return isSnakeCase(field);
  });

  const fields = createFields(["foo_bar", "baz_qux"]);

  transformRow({ baz_qux: 2, foo_bar: 1 }, fields);
  transformRow({ baz_qux: 4, foo_bar: 3 }, fields);

  t.is(calls, 2);
});
