// @flow

import {
  ArrayTokenSymbol,
  SqlTokenSymbol,
  RawSqlTokenSymbol,
  IdentifierTokenSymbol,
  IdentifierListTokenSymbol,
  ValueListTokenSymbol,
  TupleTokenSymbol,
  TupleListTokenSymbol,
  UnnestTokenSymbol
} from '../symbols';

const tokenSymbols = [
  ArrayTokenSymbol,
  SqlTokenSymbol,
  RawSqlTokenSymbol,
  IdentifierTokenSymbol,
  IdentifierListTokenSymbol,
  ValueListTokenSymbol,
  TupleTokenSymbol,
  TupleListTokenSymbol,
  UnnestTokenSymbol
];

export default (subject: *) => {
  if (typeof subject !== 'object' || subject === null) {
    return false;
  }

  return tokenSymbols.includes(subject.type);
};
