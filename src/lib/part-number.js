/**
 * Part-number normalization — the rule for deciding whether two catalogue rows
 * name the same orderable part.
 *
 * Supplier feeds disagree about the separators inside a part number: NXP's 12NC
 * suffix arrives as "74AHC132D,112" from one channel, "74AHC132D:112" from
 * another and "74AHC132D112" from a reseller. Those are one part. So separators
 * are ignored — and nothing else is.
 *
 * WHAT IS NOT A SEPARATOR
 * -----------------------
 * "+" in particular. Maxim uses it to mark the lead-free variant, so
 * "MAX505ACNG+" and "MAX505ACNG" are two different orderable items whose specs
 * differ in exactly the RoHS fields. An earlier version of this rule stripped
 * every non-alphanumeric character and reported 12,315 duplicate groups; 10,121
 * of them (82%) were "+" pairs, and consolidating them would have redirected
 * away thousands of legitimate pages. The real number was 1,861.
 *
 * Lives in its own module because scripts/dedupe-part-numbers.mjs and
 * scripts/audit-data-quality.mjs both need it, and a divergence between them
 * would mean the audit reports a duplicate count the dedupe cannot act on.
 */

/** Characters that carry no ordering meaning inside a part number. */
const PART_NUMBER_SEPARATORS = `,;:'" ._-/\\()`;

const SEPARATOR_PATTERN = /[,;:'"\s._\-/\\()]/g;

/** Normalized comparison key for a part number. */
export function normalizePartNumber(partNumber) {
  return String(partNumber ?? '').toUpperCase().replace(SEPARATOR_PATTERN, '');
}

/**
 * The same rule as a Postgres expression, for queries that have to group by it
 * over the whole table. translate() with an empty target deletes every listed
 * character; the quote doubling is the SQL literal escape.
 */
export function normalizedPartNumberSql(column = '"partNumber"') {
  return `upper(translate(${column}, '${PART_NUMBER_SEPARATORS.replace(/'/g, "''")}', ''))`;
}

export { PART_NUMBER_SEPARATORS };
