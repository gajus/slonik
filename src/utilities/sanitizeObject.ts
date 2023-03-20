import { type SerializableValue } from '../types';

export const sanitizeObject = (
  object: Record<string, unknown>,
): SerializableValue => {
  return JSON.parse(JSON.stringify(object));
};
