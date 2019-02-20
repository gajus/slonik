// @flow

import {
  arrayParser
} from 'pg-types';
import TypeOverrides from 'pg/lib/type-overrides';
import type {
  InternalDatabaseConnectionType,
  TypeParserType
} from '../types';

export default async (connection: InternalDatabaseConnectionType, typeParsers: $ReadOnlyArray<TypeParserType>) => {
  if (typeParsers.length === 0) {
    return null;
  }

  const typeNames = typeParsers.map((typeParser) => {
    return typeParser.name;
  });

  const postgresTypes = (
    await connection.query('SELECT oid, typarray, typname FROM pg_type WHERE typname = ANY($1::text[])', [
      typeNames
    ])
  ).rows;

  const types = new TypeOverrides();

  for (const typeParser of typeParsers) {
    const postgresType = postgresTypes.find((maybeTargetPostgresType) => {
      return maybeTargetPostgresType.typname === typeParser.name;
    });

    if (!postgresType) {
      throw new Error('Database type "' + typeParser.name + '" not found.');
    }

    types.setTypeParser(postgresType.oid, (value) => {
      return typeParser.parse(value);
    });

    if (postgresType.typarray) {
      types.setTypeParser(postgresType.typarray, (value) => {
        return arrayParser
          .create(
            value,
            typeParser.parse
          )
          .parse();
      });
    }
  }

  // eslint-disable-next-line id-match
  connection._types = types;

  return null;
};
