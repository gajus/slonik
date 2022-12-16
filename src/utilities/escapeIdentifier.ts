const rule = /"/gu;

/**
 * @see https://github.com/brianc/node-postgres/blob/6c840aabb09f8a2d640800953f6b884b6841384c/lib/client.js#L306-L322
 */
export const escapeIdentifier = (identifier: string): string => {
  return '"' + identifier.replace(rule, '""') + '"';
};
