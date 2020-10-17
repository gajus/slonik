// @flow

export default (maybe: any): boolean => {
  return typeof maybe === 'string' || typeof maybe === 'number' || typeof maybe === 'boolean' || maybe === null;
};
