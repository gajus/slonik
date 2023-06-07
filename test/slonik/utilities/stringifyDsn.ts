import { parseDsn } from '../../../src/utilities/parseDsn';
import { stringifyDsn } from '../../../src/utilities/stringifyDsn';
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
  'postgresql://foo@localhost/bar?sslmode=no-verify',
  'postgresql://fo%2Fo:b%2Far@localhost/ba%2Fz',
];

for (const dsn of dsns) {
  test('creates DSN ' + dsn, (t) => {
    t.is(stringifyDsn(parseDsn(dsn)), dsn);
  });
}
