import { randomUUID } from 'node:crypto';

export const generateUid = (): string => {
  return randomUUID().split('-', 1)[0];
};
