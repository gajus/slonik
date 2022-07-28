import {
  type QueryId,
} from '../types';
import {
  createUid,
} from './createUid';

export const createQueryId = (): QueryId => {
  return createUid();
};
