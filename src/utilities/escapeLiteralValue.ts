/**
 * @see https://github.com/brianc/node-postgres/blob/6c840aabb09f8a2d640800953f6b884b6841384c/lib/client.js#L325-L348
 */
export const escapeLiteralValue = (subject: string): string => {
  let hasBackslash = false;
  let escaped = "'";

  for (const character of subject) {
    if (character === "'") {
      escaped += character + character;
    } else if (character === '\\') {
      escaped += character + character;
      hasBackslash = true;
    } else {
      escaped += character;
    }
  }

  escaped += "'";

  if (hasBackslash === true) {
    escaped = 'E' + escaped;
  }

  return escaped;
};
