import type {
  QueryIdType,
} from '../types';
import {
  createUid,
} from './createUid';

export const createQueryId = (): QueryIdType => {
  return createUid() as any;
};
