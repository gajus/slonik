// @flow

import {
  types
} from 'pg';
import type {
  InternalDatabasePoolType,
  TypeParserType
} from '../types';

export default async (pool: InternalDatabasePoolType, typeParsers: $ReadOnlyArray<TypeParserType>) => {
  if (typeParsers.length === 0) {
    return null;
  }

  const typeNames = typeParsers.map((typeParser) => {
    return typeParser.name;
  });

  const postgresTypes = (
    await pool.query('SELECT oid, typarray, typname FROM pg_type WHERE typname = ANY($1::text[])', [
      typeNames
    ])
  ).rows;

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
        return types.arrayParser
          .create(
            value,
            typeParser.parse
          )
          .parse();
      });
    }
  }

  return null;
};
