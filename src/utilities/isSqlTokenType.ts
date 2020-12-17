import {
  SqlTokenType,
} from '../types';
import {
  isSqlToken,
} from './isSqlToken';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isSqlTokenType = (subject: any): subject is SqlTokenType => {
  if (typeof subject !== 'object' || subject === null) {
    return false;
  }

  return isSqlToken(subject.type);
};
