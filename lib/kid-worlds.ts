/**
 * The worlds a child moves between, and the hue each one keeps.
 *
 * One hue per world, held across the map, the episode and the reward, so a child learns
 * where they are before they can read where they are. The colours themselves live in
 * `app/tokens.css` as `[data-kid-world="…"]`; this file only names the set, so navigation
 * data and the child component layer can agree on it without importing each other.
 */
export type KidWorld =
  | "grove"
  | "city"
  | "harbor"
  | "workshop"
  | "treehouse"
  | "lab";

export const kidWorlds: KidWorld[] = ["grove", "city", "harbor", "workshop", "treehouse", "lab"];

export function isKidWorld(value: unknown): value is KidWorld {
  return typeof value === "string" && (kidWorlds as string[]).includes(value);
}

/**
 * The world a subject is taught in.
 *
 * Six subjects and six worlds, but not a coincidence in the other direction: this exists
 * so that the hue a child sees while they are *working* is the hue of the place they
 * walked into. Answering a reading question in coral when the Reading Grove is green
 * quietly tells a pre-reader that the colour means nothing — and colour carrying "where
 * am I" is most of how a child navigates before they can read (§C5).
 *
 * `subjects.ts` already carries a `hue`, but that is the grown-up ramp (leaf, amber,
 * violet…) used by parent reports and the sidebar. This is the child ramp. They are
 * deliberately separate and are allowed to disagree.
 */
const WORLD_BY_SUBJECT: Record<string, KidWorld> = {
  reading: "grove",
  math: "city",
  logic: "lab",
  science: "lab",
  world: "harbor",
  wellbeing: "treehouse",
};

/** Falls back to the grove, which is the spine (§D2) and never a surprise. */
export function worldForSubject(subject: string | undefined): KidWorld {
  return (subject && WORLD_BY_SUBJECT[subject]) || "grove";
}
