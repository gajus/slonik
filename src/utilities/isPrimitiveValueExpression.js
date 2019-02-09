// @flow

export default (maybe: *): boolean %checks => {
  return typeof maybe === 'string' || typeof maybe === 'number' || maybe === null;
};
