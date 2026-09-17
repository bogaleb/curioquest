export const gardenPieces = [
  {id:"empty",emoji:"",label:"Clear a space"},
  {id:"flower",emoji:"🌼",label:"Flower"},
  {id:"tree",emoji:"🌳",label:"Tree"},
  {id:"water",emoji:"💧",label:"Pond"},
  {id:"path",emoji:"🟨",label:"Stepping stone"},
  {id:"pot",emoji:"🪴",label:"Seed pot"},
  {id:"sunflower",emoji:"🌻",label:"Sunflower"},
  {id:"treehouse",emoji:"🏡",label:"Team treehouse"},
] as const;
export type GardenPiece = typeof gardenPieces[number]["id"];
export type AdventureProgress = {
  chapters: number[];
  unlocks: string[];
  garden: GardenPiece[];
  gardenSavedAt: string | null;
  offline: { requestedAt: string | null; confirmedAt: string | null };
  feelings: { sessionId: string; value: "easy" | "right" | "tricky"; date: string }[];
};
export function emptyAdventure(): AdventureProgress {
  return { chapters:[],unlocks:[],garden:Array(24).fill("empty"),gardenSavedAt:null,
    offline:{requestedAt:null,confirmedAt:null},feelings:[] };
}
export function normalizeAdventure(value: Partial<AdventureProgress> | undefined): AdventureProgress {
  const fallback=emptyAdventure();
  return {...fallback,...value,
    chapters:Array.isArray(value?.chapters)?[...new Set(value.chapters)].filter(n=>[0,1,2].includes(n)):[],
    unlocks:Array.isArray(value?.unlocks)?value.unlocks.filter(x=>typeof x==="string"):[],
    garden:validGarden(value?.garden)?value.garden:fallback.garden,
    offline:{...fallback.offline,...value?.offline},
    feelings:Array.isArray(value?.feelings)?value.feelings.slice(-30):[],
  };
}
export function validGarden(value: unknown): value is GardenPiece[] {
  return Array.isArray(value) && value.length===24 && value.every(piece=>gardenPieces.some(p=>p.id===piece));
}
export function gardenChallenge(garden: GardenPiece[]) {
  return [
    {label:"Give your plants a place to grow",done:garden.includes("flower")||garden.includes("tree")||garden.includes("pot")||garden.includes("sunflower")},
    {label:"Add water for the plants",done:garden.includes("water")},
    {label:"Make a path with at least 3 stepping stones",done:garden.filter(p=>p==="path").length>=3},
  ];
}
