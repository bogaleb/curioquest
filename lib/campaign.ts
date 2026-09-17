import type { GradeBand } from './skill-graph';
export const campaignChapters = [
  { id: "find", title: "The missing seeds", place: "Word Forest", emoji: "🔎", story: "The seed chest is empty! Follow Nova and Pip through Word Forest to find the first clues.", ending: "A trail of leaves leads to Pip's supply baskets. The mystery is getting smaller!", slugs: ["sound","seeds","sort","trail"], unlock: "Seed basket" },
  { id: "follow", title: "Pip's secret trail", place: "Logic Mountain", emoji: "🐾", story: "Pip remembers a leaf, a pot, and a sunny spot. Help Nova follow the trail and read the garden labels.", ending: "Found them! Pip tucked the seeds under a leaf to keep them safe. Let's bring the garden back.", slugs: ["memory","word","more","clue"], unlock: "Garden pots" },
  { id: "grow", title: "A garden for everyone", place: "CurioGarden", emoji: "🌻", story: "The seeds are home. Plan the planting, count the water, and make a flower path for our friends.", ending: "The missing seeds are growing into a garden! Now you can design your own garden and plant a real seed with a grown-up.", slugs: ["plant","water","garden-pattern","ending"], unlock: "Sunflower garden" },
] as const;

export function campaignQuestionIds(grade: GradeBand, chapter: number) {
  return campaignChapters[chapter]?.slugs.map(slug => `garden-${grade}-${slug}`) ?? [];
}
