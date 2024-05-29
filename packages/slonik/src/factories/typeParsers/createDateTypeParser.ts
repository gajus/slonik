import { type DriverTypeParser } from '@slonik/driver';

const dateParser = (value: string) => {
  return value;
};

export const createDateTypeParser = (): DriverTypeParser => {
  return {
    name: 'date',
    parse: dateParser,
  };
};
