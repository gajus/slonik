// @flow

export default (maybe: *): boolean %checks => {
  return typeof maybe === 'string' || typeof maybe === 'number' || typeof maybe === 'boolean' || maybe instanceof Date || maybe === null;
};
