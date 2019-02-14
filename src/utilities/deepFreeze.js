// @flow

/**
 * @see https://github.com/substack/deep-freeze/pull/9
 */
// eslint-disable-next-line flowtype/no-weak-types
const deepFreeze = (subject: Object) => {
  Object.freeze(subject);

  for (const prop of Object.getOwnPropertyNames(subject)) {
    if (subject.hasOwnProperty(prop) && subject[prop] !== null && (typeof subject[prop] === 'object' || typeof subject[prop] === 'function') && subject[prop].constructor !== Buffer && !Object.isFrozen(subject[prop])) {
      deepFreeze(subject[prop]);
    }
  }

  return subject;
};

export default deepFreeze;
