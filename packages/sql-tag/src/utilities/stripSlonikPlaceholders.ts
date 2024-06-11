/**
 * See comments in `formatSlonikPlaceholder` for more information.
 */
export const stripSlonikPlaceholders = (sql: string) => {
  return sql.replaceAll('$slonik_', '$');
};
