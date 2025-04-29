import { createHash } from 'node:crypto';
import { type PrimitiveValueExpression } from 'slonik';

const hash = (subject: string) => {
  return createHash('sha256').update(subject).digest('hex').slice(0, 24);
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

  // Remove any comments from the query that begin with `--`
  const bodyHash = hash(subject.replaceAll(/^\s*--.*$/gmu, ''));

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
