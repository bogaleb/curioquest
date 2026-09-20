/**
 * Learning bands describe *who* an explorer is developmentally, and therefore how an
 * activity should be delivered to them — how much is read aloud, how many choices
 * appear, how large the touch targets are, and how quickly Nova offers help.
 *
 * The two legacy content bands ("prek", "grade1") are deliberately kept as band IDs so
 * every profile and skill already stored in Supabase keeps working with no migration.
 * New bands draw on the legacy content pools via `contentBands` until native content
 * for that band exists.
 */

export type LearningBandId =
  | "early-preschool"
  | "prek"
  | "kindergarten"
  | "grade1"
  | "grade2"
  | "grade3";

/** The content pools that currently carry authored activities. */
export type ContentBand = "prek" | "grade1";

/** How much of an activity the child is expected to read without help. */
export type InstructionMode =
  | "audio-first"
  | "audio-supported"
  | "read-along"
  | "independent";

export type DeliveryProfile = {
  /** Drives whether prompts narrate automatically and how text is weighted visually. */
  instruction: InstructionMode;
  /** Narrate the prompt on arrival without the child asking. */
  autoNarrate: boolean;
  /** Upper bound on answer choices shown at once. */
  maxChoices: number;
  /** Target prompt length. Longer prompts get split or simplified for younger bands. */
  maxPromptWords: number;
  /** Minimum interactive target size in CSS pixels. */
  touchTargetPx: number;
  /** Seconds of no progress before Nova offers a hint unprompted. 0 disables. */
  hintAfterSeconds: number;
  /** Default length of a daily adventure, in minutes. */
  sessionMinutes: number;
  /** Whether keyboard text entry is an acceptable primary input. */
  allowTyping: boolean;
  /** Whether multi-step activities (2+ stages) are appropriate. */
  allowMultiStep: boolean;
  /** Relative celebration volume; younger children get more, older get less. */
  celebration: "big" | "warm" | "brief";
};

export type LearningBand = {
  id: LearningBandId;
  /** Ordered position, 0 = youngest. Use for comparisons rather than string checks. */
  stage: number;
  /** Shown to parents. */
  label: string;
  /** Shown to parents next to the label. */
  ageLabel: string;
  /** Inclusive lower bound, in whole years. */
  ageMin: number;
  /**
   * Exclusive upper bound, in whole years — a child who has turned `ageMax` belongs to
   * the next band. The final band treats it as inclusive so nine-year-olds still land.
   */
  ageMax: number;
  /** Shown to children. Never a grade level — children see identity, not placement. */
  childLabel: string;
  /** Authored content pools this band may draw from, most-preferred first. */
  contentBands: ContentBand[];
  /** Difficulty window into the 1-3 level scale used by the curriculum. */
  levelRange: [number, number];
  delivery: DeliveryProfile;
};

export const learningBands: LearningBand[] = [
  {
    id: "early-preschool",
    stage: 0,
    label: "Early Preschool",
    ageLabel: "Ages 3–4",
    ageMin: 3,
    ageMax: 4,
    childLabel: "Little Explorer",
    contentBands: ["prek"],
    levelRange: [1, 1],
    delivery: {
      instruction: "audio-first",
      autoNarrate: true,
      maxChoices: 2,
      maxPromptWords: 8,
      touchTargetPx: 88,
      hintAfterSeconds: 12,
      sessionMinutes: 8,
      allowTyping: false,
      allowMultiStep: false,
      celebration: "big",
    },
  },
  {
    id: "prek",
    stage: 1,
    label: "Pre-K",
    ageLabel: "Ages 4–5",
    ageMin: 4,
    ageMax: 5,
    childLabel: "Curious Explorer",
    contentBands: ["prek"],
    levelRange: [1, 2],
    delivery: {
      instruction: "audio-first",
      autoNarrate: true,
      maxChoices: 3,
      maxPromptWords: 12,
      touchTargetPx: 80,
      hintAfterSeconds: 15,
      sessionMinutes: 10,
      allowTyping: false,
      allowMultiStep: false,
      celebration: "big",
    },
  },
  {
    id: "kindergarten",
    stage: 2,
    label: "Kindergarten",
    ageLabel: "Ages 5–6",
    ageMin: 5,
    ageMax: 6,
    childLabel: "Brave Explorer",
    contentBands: ["prek", "grade1"],
    levelRange: [2, 3],
    delivery: {
      instruction: "audio-supported",
      autoNarrate: true,
      maxChoices: 3,
      maxPromptWords: 18,
      touchTargetPx: 72,
      hintAfterSeconds: 20,
      sessionMinutes: 12,
      allowTyping: false,
      allowMultiStep: true,
      celebration: "warm",
    },
  },
  {
    id: "grade1",
    stage: 3,
    label: "Grade 1",
    ageLabel: "Ages 6–7",
    ageMin: 6,
    ageMax: 7,
    childLabel: "Trail Finder",
    contentBands: ["grade1", "prek"],
    levelRange: [1, 3],
    delivery: {
      instruction: "read-along",
      autoNarrate: false,
      maxChoices: 4,
      maxPromptWords: 28,
      touchTargetPx: 64,
      hintAfterSeconds: 25,
      sessionMinutes: 15,
      allowTyping: true,
      allowMultiStep: true,
      celebration: "warm",
    },
  },
  {
    id: "grade2",
    stage: 4,
    label: "Grade 2",
    ageLabel: "Ages 7–8",
    ageMin: 7,
    ageMax: 8,
    childLabel: "Pathmaker",
    contentBands: ["grade1"],
    levelRange: [2, 3],
    delivery: {
      instruction: "independent",
      autoNarrate: false,
      maxChoices: 4,
      maxPromptWords: 45,
      touchTargetPx: 56,
      hintAfterSeconds: 35,
      sessionMinutes: 20,
      allowTyping: true,
      allowMultiStep: true,
      celebration: "brief",
    },
  },
  {
    id: "grade3",
    stage: 5,
    label: "Grade 3",
    ageLabel: "Ages 8–9",
    ageMin: 8,
    ageMax: 9,
    childLabel: "Wonder Seeker",
    contentBands: ["grade1"],
    levelRange: [3, 3],
    delivery: {
      instruction: "independent",
      autoNarrate: false,
      maxChoices: 4,
      maxPromptWords: 70,
      touchTargetPx: 56,
      hintAfterSeconds: 45,
      sessionMinutes: 25,
      allowTyping: true,
      allowMultiStep: true,
      celebration: "brief",
    },
  },
];

export const bandById = new Map(learningBands.map((band) => [band.id, band]));

export const DEFAULT_BAND: LearningBandId = "prek";

export function isLearningBandId(value: unknown): value is LearningBandId {
  return typeof value === "string" && bandById.has(value as LearningBandId);
}

/** Resolves any stored value — including the two legacy tracks — to a band. */
export function resolveBand(value: unknown): LearningBand {
  return bandById.get(isLearningBandId(value) ? value : DEFAULT_BAND)!;
}

/** Maps a child's age in years onto a band, clamping outside the supported range. */
export function bandForAge(age: number): LearningBand {
  if (!Number.isFinite(age)) return bandById.get(DEFAULT_BAND)!;
  const last = learningBands[learningBands.length - 1];
  if (age >= last.ageMin && age <= last.ageMax) return last;
  const match = learningBands.find((band) => age >= band.ageMin && age < band.ageMax);
  if (match) return match;
  return age < learningBands[0].ageMin ? learningBands[0] : learningBands[learningBands.length - 1];
}

/** Age in whole years from an ISO date of birth, or null when unknown. */
export function ageFromDateOfBirth(dateOfBirth: string | null | undefined, now = new Date()) {
  if (!dateOfBirth) return null;
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) return null;
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < born.getUTCMonth() ||
    (now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() < born.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age <= 18 ? age : null;
}

/** The content pool a question must belong to for this band to be offered it. */
export function contentBandsFor(band: LearningBandId): ContentBand[] {
  return resolveBand(band).contentBands;
}

/**
 * Legacy call sites typed against the two authored content pools. Bands that have no
 * native content yet fall back to their preferred pool so the app stays usable.
 */
export function primaryContentBand(band: LearningBandId): ContentBand {
  return resolveBand(band).contentBands[0];
}

export function neighbouringBand(band: LearningBandId, offset: number): LearningBand {
  const current = resolveBand(band);
  const index = Math.max(0, Math.min(learningBands.length - 1, current.stage + offset));
  return learningBands[index];
}

/** True when `band` is developmentally at or beyond `other`. */
export function atOrBeyond(band: LearningBandId, other: LearningBandId) {
  return resolveBand(band).stage >= resolveBand(other).stage;
}

function validateBands() {
  learningBands.forEach((band, index) => {
    if (band.stage !== index) throw new Error(`Band ${band.id} has a stage out of order.`);
    if (band.ageMin >= band.ageMax) throw new Error(`Band ${band.id} has an inverted age range.`);
    const previous = learningBands[index - 1];
    if (previous && previous.ageMax !== band.ageMin) {
      throw new Error(`Band ${band.id} leaves an age gap after ${previous.id}.`);
    }
    if (!band.contentBands.length) throw new Error(`Band ${band.id} has no content pool.`);
    const [low, high] = band.levelRange;
    if (low < 1 || high > 3 || low > high) throw new Error(`Band ${band.id} has an invalid level range.`);
  });
  if (bandById.size !== learningBands.length) throw new Error("Duplicate learning band ID.");
}

validateBands();
