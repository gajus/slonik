// @flow

export default (maybe: unknown): maybe is string | number | boolean | null => {
  return typeof maybe === 'string' || typeof maybe === 'number' || typeof maybe === 'boolean' || maybe === null;
};
