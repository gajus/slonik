/**
 * A stricter type guard.
 *
 * @see https://tsplay.dev/WK8zGw
 */
export const hasOwnProperty = <X extends {}, Y extends PropertyKey>(
  object: X,
  property: Y,
): object is Record<Y, unknown> & X => {
  return Object.prototype.hasOwnProperty.call(object, property);
};
