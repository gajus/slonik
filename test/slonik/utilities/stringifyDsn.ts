import test from 'ava';
import {
  parseDsn,
  stringifyDsn,
} from '../../../src/utilities';

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
];

for (const dsn of dsns) {
  test('creates DSN ' + dsn, (t) => {
    t.is(stringifyDsn(parseDsn(dsn)), dsn);
  });
}
