import { createQueryValidator } from './createQueryValidator';
import { createSqlTag, stripSlonikPlaceholders } from '@slonik/sql-tag';
import test from 'ava';

const sql = createSqlTag();

test('allows to pass a query with a single statement', async (t) => {
  const query = sql.fragment`SELECT 1`;

  const assertValidQuery = createQueryValidator();

  await t.notThrowsAsync(async () => {
    await assertValidQuery(query);
  });
});

test('allows to pass a query with a single statement (with parameters)', async (t) => {
  const query = sql.fragment`SELECT ${1}`;

  const assertValidQuery = createQueryValidator();

  await t.notThrowsAsync(async () => {
    await assertValidQuery({
      ...query,
      sql: stripSlonikPlaceholders(query.sql),
    });
  });
});

test('allows to pass a query with comments', async (t) => {
  const query = sql.fragment`
    -- Hello, World!
    SELECT 1
  `;

  const assertValidQuery = createQueryValidator();

  await t.notThrowsAsync(async () => {
    await assertValidQuery(query);
  });
});

test('throws an error if a query contains multiple statements', async (t) => {
  const query = sql.fragment`SELECT 1; SELECT 2`;

  const assertValidQuery = createQueryValidator();

  await t.throwsAsync(async () => {
    await assertValidQuery(query);
  });
});
