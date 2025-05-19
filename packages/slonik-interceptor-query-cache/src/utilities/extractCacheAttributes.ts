import { createHash } from 'node:crypto';
import type { PrimitiveValueExpression } from 'slonik';

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

const TtlRegex = /-- @cache-ttl (\d+)/u;
const DiscardEmptyRegex = /-- @cache-discard-empty (true|false)/u;
const KeyRegex = /-- @cache-key ([$\w\-:/]+)/iu;
const CommentRegex = /^\s*--.*$/gmu;

// TODO throw an error if an unknown attribute is used
export const extractCacheAttributes = (
  subject: string,
  values: readonly PrimitiveValueExpression[],
): ExtractedCacheAttributes | null => {
  const ttl = subject.match(TtlRegex)?.[1];

  if (!ttl) {
    return null;
  }

  // Remove any comments from the query that begin with `--`
  const bodyHash = hash(subject.replaceAll(CommentRegex, ''));

  const discardEmpty = subject.match(DiscardEmptyRegex)?.[1] === 'true';

  const valueHash = hash(JSON.stringify(values));

  const key = subject.match(KeyRegex)?.[1] ?? `query:$bodyHash:$valueHash`;

  return {
    bodyHash,
    discardEmpty,
    key,
    ttl: Number(ttl),
    valueHash,
  };
};
