import {
  randomUUID,
} from 'crypto';

export const createUid = (): string => {
  return randomUUID().split('-', 1)[0];
};
