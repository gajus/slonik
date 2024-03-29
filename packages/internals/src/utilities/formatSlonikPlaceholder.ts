/**
 * Slonik allows to compose queries using fragments, e.g.
 * ```ts
 * sql.fragment`SELECT ${sql.fragment`${1}`}`;
 * ```
 * Take a look at the logic in `createFragmentSqlFragment` to see how we detect nested fragments.
 * When we detect a nested fragment, we need to offset the index of the placeholder.
 * Historically, we used a placeholder format that was based on the index of the placeholder, e.g. $1, $2, etc.
 * The problem with that approach was that any mention of $\d inside of a nested fragment was wrongly identified as a placeholder.
 * To avoid that, we now use a placeholder that is prefixed with $slonik_.
 * This way, we can safely detect placeholders that are part of a nested fragment.
 */
export const formatSlonikPlaceholder = (index: number) => {
  return '$slonik_' + String(index);
};
