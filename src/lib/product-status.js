/**
 * Lifecycle status presentation — single source of truth.
 *
 * The importer vocabulary (mapStatus in scripts/import-jsonl.mjs) is
 * active | obsolete | nrnd | lastbuy; 'eol' also appears in earlier imports.
 *
 * This module exists because the label/colour logic used to be duplicated in
 * three renderers and none of them handled 'lastbuy': the product page fell
 * through to `map[status] || map.active` and painted 5K last-time-buy parts
 * with a green "Active" badge, while the category and search tables showed the
 * same parts as "LASTBUY". Same part, two different lifecycle claims.
 */

const STATUSES = {
  active: {
    label: 'Active',
    short: 'ACTIVE',
    badgeClass: 'badge-success',
    schemaLabel: 'Active',
  },
  lastbuy: {
    label: 'Last Time Buy',
    short: 'LTB',
    badgeClass: 'badge-warning',
    schemaLabel: 'Last Time Buy',
  },
  nrnd: {
    label: 'Not Recommended',
    short: 'NRND',
    badgeClass: 'badge-info',
    schemaLabel: 'Not Recommended for New Design',
  },
  eol: {
    label: 'End of Life',
    short: 'EOL',
    badgeClass: 'badge-warning',
    schemaLabel: 'End of Life',
  },
  obsolete: {
    label: 'Obsolete',
    short: 'OBSOLETE',
    badgeClass: 'badge-danger',
    schemaLabel: 'Obsolete',
  },
};

// Ordered most-current first — used for the category sidebar filter list.
const STATUS_KEYS = ['active', 'lastbuy', 'nrnd', 'eol', 'obsolete'];

/**
 * Presentation metadata for a status. An unrecognised value is echoed back
 * verbatim rather than being silently relabelled as something friendlier —
 * mislabelling a lifecycle state is worse than showing a raw one.
 */
function getStatusInfo(status) {
  if (STATUSES[status]) return STATUSES[status];
  const raw = String(status || 'unknown');
  return {
    label: raw,
    short: raw.toUpperCase(),
    badgeClass: 'badge-info',
    schemaLabel: raw,
  };
}

function isKnownStatus(status) {
  return Object.prototype.hasOwnProperty.call(STATUSES, status);
}

export { STATUS_KEYS, getStatusInfo, isKnownStatus };
