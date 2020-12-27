import type {
  QueryIdType,
} from '../types';
import {
  createUid,
} from './createUid';

export const createQueryId = (): QueryIdType => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createUid() as any;
};
