/**
 * Which version of the content catalogue an event was recorded against.
 *
 * Every learning event carries this. Without it, a later analysis cannot tell the
 * difference between "children stopped getting this item right" and "we rewrote the
 * item", and item health (WP-06) would quietly compare two different questions wearing
 * the same id.
 *
 * Today content still lives partly in the bundle, so the default is the code version.
 * WP-05 moves the catalogue into Postgres with a real published version, and this is
 * the single place that has to learn about it.
 */

/**
 * Bump when the authored bank in `lib/` changes in a way that alters what a child sees.
 *
 * It is a manual number on purpose: hashing the bank at boot would change the version on
 * every whitespace edit and shred the analysis into thousands of one-row cohorts.
 */
export const CODE_CATALOGUE_VERSION = "code-1";

export function catalogueVersion(published?: { version?: number | null } | null) {
  const version = published?.version;
  return typeof version === "number" && Number.isFinite(version)
    ? `db-${version}`
    : CODE_CATALOGUE_VERSION;
}
