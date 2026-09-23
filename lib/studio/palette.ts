import type { ColourFamily, StudioColour, StudioTier } from "./types";

/**
 * The paint box.
 *
 * Every colour has a name a child can say and a token from `app/tokens.css` — never a raw
 * hex, which is the rule for the whole child layer and is not relaxed because this one
 * happens to be *about* colour.
 *
 * ## Why the box gets bigger with age
 *
 * The old studio offered nine colours and a system colour picker to everyone. The picker
 * is a spectrum dialog that a four-year-old cannot operate and a three-year-old cannot
 * see the point of; nine unnamed swatches is too few for an eight-year-old who wants a
 * sky that is not the same blue as a robot.
 *
 * So the box is banded: **eight** named colours for the youngest, **eighteen** in the
 * middle, **twenty-eight** for the oldest, arranged in families so that finding "another
 * green" is a glance rather than a search. Nobody gets a spectrum dialog. Choosing from a
 * named, curated set is also what makes a child's picture look composed — which is most
 * of why a real colouring book has a printed palette on the back.
 */

const colour = (id: string, name: string, token: string, family: ColourFamily): StudioColour => ({
  id, name, token, family,
});

/**
 * Every colour in the box, ordered by family.
 *
 * `paper` is first and is the one non-colour: it is what an uncoloured region is, and
 * what the eraser puts back. A child needs to be able to change their mind about a fill
 * without undoing everything they did afterwards.
 */
export const studioColours: StudioColour[] = [
  colour("paper", "Paper", "--kid-surface", "quiet"),

  /* ---- warm ------------------------------------------------------------- */
  colour("sunflower", "Sunflower", "--kid-sun-300", "warm"),
  colour("honey", "Honey", "--kid-sun-400", "warm"),
  colour("apricot", "Apricot", "--kid-sun-200", "warm"),
  colour("tomato", "Tomato", "--kid-coral-400", "warm"),
  colour("coral", "Coral", "--kid-coral-300", "warm"),
  colour("blush", "Blush", "--kid-coral-200", "warm"),
  colour("berry", "Berry", "--kid-berry-400", "warm"),
  colour("rose", "Rose", "--kid-berry-300", "warm"),
  colour("candyfloss", "Candyfloss", "--kid-berry-200", "warm"),

  /* ---- cool -------------------------------------------------------------- */
  colour("sky", "Sky", "--kid-sky-200", "cool"),
  colour("sea", "Sea", "--kid-sky-400", "cool"),
  colour("deepsea", "Deep sea", "--kid-sky-600", "cool"),
  colour("ice", "Ice", "--kid-sky-50", "cool"),
  colour("lavender", "Lavender", "--kid-grape-200", "cool"),
  colour("grape", "Grape", "--kid-grape-400", "cool"),
  colour("midnight", "Midnight", "--kid-grape-600", "cool"),

  /* ---- green -------------------------------------------------------------- */
  colour("leaf", "Leaf", "--kid-leaf-300", "green"),
  colour("moss", "Moss", "--kid-leaf-500", "green"),
  colour("mint", "Mint", "--kid-leaf-100", "green"),
  colour("forest", "Forest", "--kid-leaf-600", "green"),
  colour("meadow", "Meadow", "--scene-ground", "green"),

  /* ---- earth --------------------------------------------------------------- */
  colour("bark", "Bark", "--scene-bark", "earth"),
  colour("cocoa", "Cocoa", "--scene-bark-deep", "earth"),
  colour("sand", "Sand", "--scene-path", "earth"),
  colour("stone", "Stone", "--scene-stone", "earth"),
  colour("timber", "Timber", "--scene-timber", "earth"),
  colour("brick", "Brick", "--scene-roof", "earth"),

  /* ---- the quiet end -------------------------------------------------------- */
  colour("ink", "Ink", "--kid-ink", "quiet"),
];

export const colourById = new Map(studioColours.map((entry) => [entry.id, entry]));

/**
 * How many colours each tier is handed, and in what order.
 *
 * The youngest set is chosen rather than sliced: it is the eight a child names first —
 * red, yellow, blue, green, pink, purple, brown, black — under the names this product
 * uses for them, plus paper. Slicing the full list alphabetically would have given a
 * three-year-old apricot and no red.
 */
const EXPLORER = [
  "paper", "tomato", "sunflower", "sky", "leaf", "rose", "grape", "bark", "ink",
];

const INVESTIGATOR = [
  "paper", "tomato", "coral", "sunflower", "honey", "sky", "sea", "lavender", "grape",
  "leaf", "moss", "mint", "berry", "rose", "bark", "sand", "stone", "ink",
];

export function paletteFor(tier: StudioTier): StudioColour[] {
  const ids = tier === "explorer" ? EXPLORER : tier === "investigator" ? INVESTIGATOR : null;
  if (!ids) return studioColours;
  return ids.map((id) => colourById.get(id)!).filter(Boolean);
}

/** The families present in a tier's box, in the order the palette lays them out. */
export function familiesFor(tier: StudioTier): ColourFamily[] {
  const present = new Set(paletteFor(tier).map((entry) => entry.family));
  return (["warm", "green", "cool", "earth", "quiet"] as ColourFamily[]).filter((family) =>
    present.has(family),
  );
}

/**
 * A colour that is not the one already there.
 *
 * Used by "surprise me", which fills the whole page at random. It is the single most
 * requested thing in any colouring app and it is also a teaching move: a child who has
 * never put a purple sky on a house sees one, and then has to decide whether they meant
 * it. Deterministic from a seed so the same page does not re-roll on every render.
 */
export function surpriseColour(tier: StudioTier, seed: number, avoid?: string): StudioColour {
  const box = paletteFor(tier).filter((entry) => entry.id !== "paper" && entry.id !== avoid);
  return box[Math.abs(seed) % box.length];
}
