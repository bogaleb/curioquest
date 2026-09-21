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
