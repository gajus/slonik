import type { DriverTypeParser } from '@slonik/driver';

const numericParser = (value: string) => {
  return Number.parseFloat(value);
};

export const createNumericTypeParser = (): DriverTypeParser => {
  return {
    name: 'numeric',
    parse: numericParser,
  };
};
