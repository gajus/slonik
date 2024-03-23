import { parseDsn } from './parseDsn';
import { stringifyDsn } from './stringifyDsn';
import test from 'ava';

const dsns = [
  'postgresql://',
  'postgresql://localhost',
  'postgresql://localhost:5432',
  'postgresql://localhost/foo',
  'postgresql://foo@localhost',
  'postgresql://foo:bar@localhost',
  'postgresql://foo@localhost/bar',
  'postgresql://foo@localhost/bar?application_name=foo',
  'postgresql://foo@localhost/bar?options=-c%20search_path%3Dfoo',
  'postgresql://foo@localhost/bar?sslmode=no-verify',
  'postgresql://fo%2Fo:b%2Far@localhost/ba%2Fz',
];

for (const dsn of dsns) {
  test('creates DSN ' + dsn, (t) => {
    t.is(stringifyDsn(parseDsn(dsn)), dsn);
  });
}
