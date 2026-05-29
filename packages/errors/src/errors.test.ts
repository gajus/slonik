import {
  ForeignKeyIntegrityConstraintViolationError,
  NotNullIntegrityConstraintViolationError,
  SlonikError,
  UniqueIntegrityConstraintViolationError,
} from "./errors.js";
import test from "ava";

test("should be able to create an error", (t) => {
  const error = new SlonikError("foo");

  t.true(error instanceof Error);
});

test("extracts a single column from a unique violation detail", (t) => {
  const error = new UniqueIntegrityConstraintViolationError(
    Object.assign(new Error("duplicate key value violates unique constraint"), {
      constraint: "person_email_idx",
      detail: "Key (email)=(foo@bar.com) already exists.",
      table: "person",
    }),
  );

  t.deepEqual(error.columns, ["email"]);
  t.is(error.constraint, "person_email_idx");
  t.is(error.detail, "Key (email)=(foo@bar.com) already exists.");
  t.is(error.table, "person");
});

test("extracts composite columns from a unique violation detail", (t) => {
  const error = new UniqueIntegrityConstraintViolationError(
    Object.assign(new Error("duplicate key value violates unique constraint"), {
      detail: "Key (owner_id, name)=(1, example) already exists.",
    }),
  );

  t.deepEqual(error.columns, ["owner_id", "name"]);
});

test("extracts columns from a foreign key violation detail", (t) => {
  const error = new ForeignKeyIntegrityConstraintViolationError(
    Object.assign(new Error("insert or update on table violates foreign key constraint"), {
      detail: 'Key (parent_id)=(1) is not present in table "parent".',
    }),
  );

  t.deepEqual(error.columns, ["parent_id"]);
});

test("extracts the referenced column from a still-referenced foreign key violation detail", (t) => {
  const error = new ForeignKeyIntegrityConstraintViolationError(
    Object.assign(new Error("update or delete on table violates foreign key constraint"), {
      detail: 'Key (id)=(1) is still referenced from table "child".',
    }),
  );

  t.deepEqual(error.columns, ["id"]);
});

test("derives columns from the column field for a not-NULL violation", (t) => {
  const error = new NotNullIntegrityConstraintViolationError(
    Object.assign(new Error("null value in column violates not-null constraint"), {
      column: "name",
      table: "person",
    }),
  );

  t.deepEqual(error.columns, ["name"]);
  t.is(error.column, "name");
});

test("columns is empty when no detail or column is available", (t) => {
  const error = new UniqueIntegrityConstraintViolationError(
    new Error("duplicate key value violates unique constraint"),
  );

  t.deepEqual(error.columns, []);
  t.is(error.detail, null);
});

test("does not extract columns from an expression index detail", (t) => {
  const error = new UniqueIntegrityConstraintViolationError(
    Object.assign(new Error("duplicate key value violates unique constraint"), {
      detail: "Key (lower(email))=(foo@bar.com) already exists.",
    }),
  );

  t.deepEqual(error.columns, []);
});
