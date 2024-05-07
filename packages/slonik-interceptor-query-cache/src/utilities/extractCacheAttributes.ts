import { createHash } from 'node:crypto';
import { type PrimitiveValueExpression } from 'slonik';
import stripComments from 'strip-comments';

const hash = (subject: string) => {
  return createHash('shake256', {
    outputLength: 12,
  })
    .update(subject)
    .digest('hex');
};

export type ExtractedCacheAttributes = {
  bodyHash: string;
  discardEmpty: boolean;
  key: string;
  ttl: number;
  valueHash: string;
};

// TODO throw an error if an unknown attribute is used
export const extractCacheAttributes = (
  subject: string,
  values: readonly PrimitiveValueExpression[],
): ExtractedCacheAttributes | null => {
  const ttl = /-- @cache-ttl (\d+)/u.exec(subject)?.[1];

  // https://github.com/jonschlinkert/strip-comments/issues/71
  const bodyHash = hash(
    stripComments(subject)
      .replaceAll(/^\s*--.*$/gmu, '')
      .replaceAll(/\s/gu, ''),
  );

  const discardEmpty =
    (/-- @cache-discard-empty (true|false)/u.exec(subject)?.[1] ?? 'false') ===
    'true';

  const valueHash = hash(JSON.stringify(values));

  if (ttl) {
    const key =
      /-- @cache-key ([$\w\-:/]+)/iu.exec(subject)?.[1] ??
      'query:$bodyHash:$valueHash';

    return {
      bodyHash,
      discardEmpty,
      key,
      ttl: Number(ttl),
      valueHash,
    };
  }

  return null;
};
