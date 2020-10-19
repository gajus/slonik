// @flow

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (maybe: any): boolean => {
  return typeof maybe === 'string' || typeof maybe === 'number' || typeof maybe === 'boolean' || maybe === null;
};
