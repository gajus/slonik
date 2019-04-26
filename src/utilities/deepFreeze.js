// @flow

/**
 * @see https://github.com/substack/deep-freeze/pull/9
 */
// eslint-disable-next-line flowtype/no-weak-types
const deepFreeze = (subject: Object) => {
  Object.freeze(subject);

  for (const property of Object.getOwnPropertyNames(subject)) {
    if (subject.hasOwnProperty(property) && subject[property] !== null && (typeof subject[property] === 'object' || typeof subject[property] === 'function') && subject[property].constructor !== Buffer && !Object.isFrozen(subject[property])) {
      deepFreeze(subject[property]);
    }
  }

  return subject;
};

export default deepFreeze;
