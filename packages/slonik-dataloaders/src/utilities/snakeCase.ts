/**
 * Adopted from https://npmjs.com/snake-case
 */

// Regexps involved with splitting words in various case formats.
const SPLIT_LOWER_UPPER_RE = /([\p{Ll}\d])(\p{Lu})/gu;
const SPLIT_UPPER_UPPER_RE = /(\p{Lu})(\p{Lu}\p{Ll})/gu;
// Regexp involved with stripping non-word characters from the result.
const DEFAULT_STRIP_REGEXP = /[^\p{L}\d]+/giu;
// The replacement value for splits.
const SPLIT_REPLACE_VALUE = '$1\0$2';

/**
 * Split any cased input strings into an array of words.
 */
const split = (input: string): string[] => {
  let result = input
    .replaceAll(SPLIT_LOWER_UPPER_RE, SPLIT_REPLACE_VALUE)
    .replaceAll(SPLIT_UPPER_UPPER_RE, SPLIT_REPLACE_VALUE);

  result = result.replaceAll(DEFAULT_STRIP_REGEXP, '\0');
  let start = 0;
  let end = result.length;
  // Trim the delimiter from around the output string.
  while (result.charAt(start) === '\0') start++;
  if (start === end) return [];
  while (result.charAt(end - 1) === '\0') end--;
  // Transform each token independently.
  return result.slice(start, end).split(/\0/gu);
};

export const snakeCase = (input: string) => {
  return split(input)
    .map((fragment) => fragment.toLowerCase())
    .join('_');
};
