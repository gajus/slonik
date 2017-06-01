// @flow

const inlineCommentRule = /(.*?)--.*/g;
const multilineCommentRule = /\/\*[\s\S]*?\*\//mg;
const whiteSpaceRule = /\s+/g;

export default (input: string): string => {
  return input
    .replace(inlineCommentRule, (match, p1) => {
      return p1;
    })
    .replace(multilineCommentRule, '')
    .replace(whiteSpaceRule, ' ')
    .trim();
};
