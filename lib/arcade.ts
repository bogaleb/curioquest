import type { GradeTrack } from "./explorers";

export const arcadeGames = [
  { id: "robot", title: "Robot Commander", emoji: "🤖", color: "lavender", subject: "logic", tagline: "A little code. A big adventure.", description: "Plan a route, queue your moves, and guide Pip's robot around the rocks.", skills: "Planning · directions · problem solving", missions: ["First delivery", "Around the rocks", "The long way home"] },
  { id: "kitchen", title: "Number Kitchen", emoji: "🥞", color: "peach", subject: "math", tagline: "Something clever is cooking.", description: "Fill the picnic trays and help every friend get a snack.", skills: "Counting · addition · subtraction", missions: ["Picnic prep", "Busy breakfast", "Forest feast"] },
  { id: "words", title: "Word Workshop", emoji: "🔤", color: "mint", subject: "reading", tagline: "Build a word. Open a world.", description: "Find letter partners and build labels for Nova's collection.", skills: "Letter knowledge · blending · spelling", missions: ["The letter chest", "Little word makers", "Labels for everyone"] },
  { id: "memory", title: "Memory Train", emoji: "🚂", color: "sky", subject: "logic", tagline: "All aboard the remembering express.", description: "Remember the special delivery and load the carriages in order.", skills: "Working memory · attention · sequencing", missions: ["Garden delivery", "Ocean express", "Moonlight mail"] },
  { id: "patterns", title: "Pattern Carnival", emoji: "🎡", color: "rose", subject: "logic", tagline: "Find the rhythm of the fair.", description: "Repair the carnival garlands by discovering the repeating group.", skills: "Pattern recognition · prediction", missions: ["Ribbon parade", "Lantern lane", "The grand garland"] },
  { id: "shapes", title: "Shape Safari", emoji: "🦋", color: "gold", subject: "math", tagline: "Spot the shapes hiding in plain sight.", description: "Match shapes with their names and pack the discovery kit.", skills: "Geometry · observation · matching", missions: ["Shape spotting", "Explorer's toolkit", "Safari celebration"] },
  { id: "steps", title: "Story Steps", emoji: "🪁", color: "mint", subject: "logic", tagline: "Every adventure has a first step.", description: "Put picture cards in order to plant, cook, build, and explore.", skills: "Sequencing · planning · cause and effect", missions: ["A day with Pip", "Make something new", "Ready for adventure"] },
  { id: "stories", title: "Story Cove", emoji: "⛵", color: "sky", subject: "reading", tagline: "Small stories. Wonderful ideas.", description: "Listen to Nova's original mini-stories and look for clues together.", skills: "Listening · comprehension · reasoning", missions: ["Forest friends", "Unexpected discoveries", "Helping hands"] },
] as const;
export type ArcadeGameId = typeof arcadeGames[number]["id"];
export type ArcadeProgress = Record<string, { levels: number[]; plays: number; lastPlayedAt: string }>;
export function arcadeKey(grade: GradeTrack, game: string) { return `${grade}:${game}`; }
export function gameById(value: unknown) { return arcadeGames.find(game => game.id === value); }
export function arcadeQuestionIds(grade: GradeTrack, game: ArcadeGameId, level: number) {
  return Array.from({ length: 4 }, (_, index) => `arcade-${grade}-${game}-${level * 4 + index}`);
}
export function normalizeArcade(value: unknown): ArcadeProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: ArcadeProgress = {};
  for (const grade of ["prek", "grade1"] as GradeTrack[]) for (const game of arcadeGames) {
    const key = arcadeKey(grade, game.id), entry = (value as ArcadeProgress)[key];
    if (!entry || !Array.isArray(entry.levels)) continue;
    result[key] = { levels: [...new Set(entry.levels)].filter(n => Number.isInteger(n) && n >= 0 && n < 3),
      plays: Math.max(0, Math.floor(Number(entry.plays) || 0)), lastPlayedAt: typeof entry.lastPlayedAt === "string" ? entry.lastPlayedAt : "" };
  }
  return result;
}
