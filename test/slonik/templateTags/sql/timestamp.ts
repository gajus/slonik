import test from 'ava';
import {
  createSqlTag,
} from '../../../../src/factories/createSqlTag';
import {
  SqlToken,
} from '../../../../src/tokens';

const sql = createSqlTag();

test('binds a timestamp', (t) => {
  const query = sql`SELECT ${sql.timestamp(new Date('2022-08-19T03:27:24.951Z'))}`;

  t.deepEqual(query, {
    sql: 'SELECT to_timestamp($1)',
    type: SqlToken,
    values: [
      '1660879644.951',
    ],
  });
});

test('throws if not instance of Date', (t) => {
  const error = t.throws(() => {
    // @ts-expect-error
    sql`SELECT ${sql.date(1)}`;
  });

  t.is(error?.message, 'Date parameter value must be an instance of Date.');
});
