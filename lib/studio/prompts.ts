import type { DrawingPrompt, StudioTier } from "./types";

/**
 * Invitations to draw.
 *
 * Not challenges, and not tasks with a right answer — an invitation a child can decline
 * is the only kind that belongs on a blank page. The old studio had eight of these and
 * called them "creative challenges", which is a small thing and the wrong word: a child
 * who draws something else has not failed a challenge.
 *
 * They are banded because "draw three things beginning with B" is a reading task wearing
 * a drawing hat, and it is a good one for a six-year-old and meaningless to a
 * three-year-old. The youngest set asks for one thing, in one colour, with no counting.
 */

const ALL: StudioTier[] = ["explorer", "investigator", "scientist"];
const OLDER: StudioTier[] = ["investigator", "scientist"];
const OLDEST: StudioTier[] = ["scientist"];

const prompt = (
  id: string,
  tiers: StudioTier[],
  art: DrawingPrompt["art"],
  explorer: string,
  investigator: string,
  scientist: string,
): DrawingPrompt => ({ id, tiers, art, text: { explorer, investigator, scientist } });

export const drawingPrompts: DrawingPrompt[] = [
  prompt("weather", ALL, "sun",
    "Draw the weather outside your window.",
    "Draw the weather outside, without using any words.",
    "Draw today's weather so that someone indoors could tell what it is doing."),
  prompt("home", ALL, "roof",
    "Draw where you live.",
    "Draw your home, and one thing that is always outside it.",
    "Draw your home from a place you have actually stood."),
  prompt("creature", ALL, "ear",
    "Draw an animal.",
    "Invent an animal, and give it something that helps it.",
    "Invent an animal for one habitat, and give it three features that fit."),
  prompt("food", ALL, "heart",
    "Draw something you like to eat.",
    "Draw a meal you would make for a friend.",
    "Draw a meal, and label one thing on it."),
  prompt("face", ALL, "eye",
    "Draw a happy face.",
    "Draw someone feeling something, without writing the feeling down.",
    "Draw a face that is feeling two things at once."),
  prompt("garden", ALL, "leaf",
    "Draw a flower.",
    "Draw a garden with something living in it.",
    "Draw a garden through a whole year, in four boxes."),

  prompt("machine", OLDER, "wheel",
    "Draw a big machine.",
    "Invent a machine that does one helpful job.",
    "Invent a machine, and show where the force goes in and where the work comes out."),
  prompt("bridge", OLDER, "arch",
    "Draw a bridge.",
    "Design a bridge for two small animals to cross.",
    "Design a bridge and show what is holding it up."),
  prompt("map", OLDER, "star",
    "Draw a path.",
    "Draw a map of somewhere you know well.",
    "Draw a map with a key, and put something on it nobody else would know."),
  prompt("underwater", OLDER, "fin",
    "Draw a fish.",
    "Draw what is under the sea where nobody has looked.",
    "Draw a deep-sea animal that never sees light, and say what it uses instead of eyes."),
  prompt("space", OLDER, "crescent",
    "Draw the moon.",
    "Draw a planet nobody has visited yet.",
    "Draw a planet, and show what its sky would look like from the ground."),

  prompt("shapes", OLDEST, "diamond",
    "Draw a house with a triangle on top.",
    "Build a picture from only circles, squares and triangles.",
    "Build a picture from only circles, squares and triangles — no other shape anywhere."),
  prompt("before-after", OLDEST, "flame",
    "Draw something growing.",
    "Draw the same thing twice: before, and after.",
    "Draw the same scene twice, and change exactly one thing between them."),
  prompt("sound", OLDEST, "wave",
    "Draw something loud.",
    "Draw a sound, without drawing the thing making it.",
    "Draw a sound. You may not draw whatever is making it."),
];

export function promptsForTier(tier: StudioTier): DrawingPrompt[] {
  return drawingPrompts.filter((entry) => entry.tiers.includes(tier));
}

/**
 * Today's invitation.
 *
 * Deterministic from a number the caller owns — how many pieces are already in the
 * gallery — rather than random, so it does not change under a child who walked away and
 * came back. A prompt that re-rolls on every render is one a child cannot show to a
 * grown-up.
 */
export function promptFor(tier: StudioTier, seed: number): DrawingPrompt {
  const set = promptsForTier(tier);
  return set[Math.abs(Math.trunc(seed)) % set.length];
}
