export const isPlainObject = (subject: unknown) => {
  if (typeof subject !== 'object' || subject === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(subject);
  return (
    (prototype === null ||
      prototype === Object.prototype ||
      Object.getPrototypeOf(prototype) === null) &&
    !(Symbol.toStringTag in subject) &&
    !(Symbol.iterator in subject)
  );
};
