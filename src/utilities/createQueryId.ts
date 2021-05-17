import {
  createUid,
} from './createUid';
import type {
  QueryIdType,
} from '../types';

export const createQueryId = (): QueryIdType => {
  return createUid() as any;
};
