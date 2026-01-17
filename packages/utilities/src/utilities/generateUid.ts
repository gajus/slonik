import { randomBytes } from 'node:crypto';

export const generateUid = (): string => {
  return randomBytes(4).toString('hex');
};
