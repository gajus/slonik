// @flow

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isSubjectFreezable = (subject: any): boolean => {
  return Boolean(
    subject !== null &&
    (typeof subject === 'object' ||
    typeof subject === 'function') &&
    subject.constructor !== Buffer &&
    !Object.isFrozen(subject),
  );
};

/**
 * @see https://github.com/substack/deep-freeze/pull/9
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deepFreeze = (subject: any) => {
  if (!isSubjectFreezable(subject)) {
    return subject;
  }

  Object.freeze(subject);

  for (const property of Object.getOwnPropertyNames(subject)) {
    if (subject.hasOwnProperty(property) && isSubjectFreezable(subject[property])) {
      deepFreeze(subject[property]);
    }
  }

  return subject;
};

export default deepFreeze;
