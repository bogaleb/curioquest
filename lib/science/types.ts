import type { ErrorKind } from "@/lib/error-kinds";
import type { LearningVerb } from "@/lib/learning-events";
import type { LearningPhase } from "@/lib/skill-graph";

/**
 * The Wonder Lab content model.
 *
 * What was here before was nine `Experiment` records, each a question with a list of
 * objects and a single correct word per object. It shipped the answer key to the browser,
 * recorded nothing, and said the same sentence to a three-year-old and a nine-year-old.
 * It was a quiz wearing a lab coat, which is precisely what Wave 07 exists to stop.
 *
 * Three ideas hold this replacement together.
 *
 * **A station is a cycle, not a question.** Every station runs observe → predict → test →
 * observe → explain, and the child cannot reach the prediction without having looked
 * first. That ordering is the content, so it lives in the type rather than in whichever
 * component happens to render it.
 *
 * **Age is authored, never computed.** A tier is not a difficulty multiplier applied to
 * one string. Each tier has its own prompt, its own observation sentence, its own
 * explanation and its own notebook question, written for a child who reads differently,
 * holds a different amount in mind at once, and is owed a different kind of answer. A
 * three-year-old gets "the cork stays on top"; a nine-year-old gets density, and a reason
 * that survives the follow-up question.
 *
 * **Nothing here knows how it is drawn.** A station names a *model* — a tank, a ramp, a
 * beam of light — and the child layer owns what that looks like and how it moves. That is
 * what makes the lab extensible by content rather than by component: a new floating
 * investigation is a record in `lib/science/content/`, not a new React file.
 *
 * Answers never leave the server. `lib/science/lab.ts` derives the public shape, and
 * `app/api/lab/route.ts` is the only place a response is judged (§A).
 */

/* ==========================================================================
   WHO IT IS FOR
   ========================================================================== */

/**
 * The three authored voices of the lab.
 *
 * Six learning bands, three tiers, because the thing that changes between a four- and a
 * five-year-old is how big the buttons are and how much is read aloud — the delivery
 * profile in `lib/learning-bands.ts` already handles that. What changes between a
 * four-year-old and an eight-year-old is what a true answer is allowed to contain, and
 * that has to be written by a person three times.
 *
 *   explorer      3–5   notice, name, match. One variable, two outcomes, no vocabulary.
 *   investigator  5–7   predict from a clue, compare two results, first real terms.
 *   scientist     7–9   fair tests, evidence, mechanism, and the word for it.
 */
export type LabTier = "explorer" | "investigator" | "scientist";

export const labTiers: LabTier[] = ["explorer", "investigator", "scientist"];

/** Copy that exists once per tier. Authoring a station means writing all three. */
export type ByTier<T> = Record<LabTier, T>;

/**
 * The strands of Wave 07's topic list, grouped the way a child meets them rather than the
 * way a curriculum document lists them. Used for the lab's shelves and for balance checks
 * in the tests — a lab that is nine physics stations and one plant is not a science lab.
 */
export type LabStrand =
  | "life"      // animals, plants, habitats, life cycles, ecosystems
  | "earth"     // weather, seasons, rocks, oceans, day and night, space
  | "matter"    // states of matter, materials, floating, dissolving
  | "forces"    // push and pull, motion, friction, magnets, simple machines
  | "energy"    // light, shadow, sound, heat
  | "body";     // the senses, and the body that carries them

export const labStrands: LabStrand[] = ["life", "earth", "matter", "forces", "energy", "body"];

/* ==========================================================================
   THE ANIMATED MODELS
   ==========================================================================

   A station names the apparatus it happens in. The child layer draws it and moves it;
   nothing in the content decides a colour, a duration or a path.

   Keeping this a closed union rather than a free string is what makes the
   "every station has art" test possible, and it stops the content drifting ahead of the
   drawing — a new model means a new picture, on purpose.
   ========================================================================== */

export type LabModel =
  | "tank"      // a water tank, seen from the side: floating, sinking, dissolving
  | "ramp"      // a slope and a rolling car: friction, speed, distance
  | "magnet"    // a magnet and an object on a bench
  | "beam"      // a lamp shining at a material, and the shadow behind it
  | "pot"       // soil, a seedling and whatever it is being given
  | "warmth"    // a plate in a warm room: melting, freezing, evaporating
  | "sky"       // the sky over a hill: weather, day and night, the seasons
  | "drum"      // a stretched skin and the grains on it: sound as vibration
  | "bench";    // the plain workbench, for stations with no apparatus

/**
 * Which way the model ends up. The child layer maps these onto movement — `rise` floats
 * something to the surface, `fall` sinks it, `still` leaves it where it was.
 *
 * Deliberately physical rather than semantic: the same `rise` animates a cork coming up
 * and a balloon going up, and neither of them needs the model to know what "buoyant"
 * means.
 */
export type LabMotion = "rise" | "fall" | "still" | "travel" | "stop" | "grow" | "wilt" | "shine" | "block" | "shake";

/* ==========================================================================
   THE ACTIVITIES
   ========================================================================== */

/** One thing a child can be wrong about, and why. Drives the teaching response (§C3). */
export type LabChoice = {
  id: string;
  /** Child-facing, per tier: "it stays on top" / "it floats" / "it will float". */
  label: ByTier<string>;
  /** Only on wrong choices. A right choice carries none. */
  errorKind?: ErrorKind;
  /** What Nova says when this particular wrong idea is chosen. Never "no". */
  response?: string;
};

/**
 * Something to look at before predicting.
 *
 * The gate is the whole point: outcomes stay locked until every clue has been opened. A
 * prediction made before looking is a guess, and an activity that lets a child skip the
 * observing has quietly become multiple choice again whatever it is called.
 */
export type LabClue = {
  id: string;
  /** What the child taps: "pick it up", "look at the water". An action, not a noun. */
  label: ByTier<string>;
  /** What they notice. One sentence. Never contains the outcome. */
  detail: ByTier<string>;
};

/**
 * Observe → predict → test. The spine of the lab.
 *
 * `setups` are the things that can be put into the same apparatus. A station with four
 * setups is four runs of the cycle with one variable changed each time, which is where
 * comparison — and, for the scientist tier, the idea of a fair test — comes from.
 */
export type PredictActivity = {
  kind: "predict";
  model: LabModel;
  /** The question the apparatus keeps asking, per tier. */
  question: ByTier<string>;
  outcomes: LabChoice[];
  setups: PredictSetup[];
};

export type PredictSetup = {
  id: string;
  /** What is being put in: "a cork", "a stone". */
  name: ByTier<string>;
  /** The drawn thing on the bench. Owned by the child layer. */
  art: LabObjectArt;
  clues: LabClue[];
  /** Which outcome actually happens. Never sent to the browser. */
  outcome: string;
  /** How the model moves when the test runs. */
  motion: LabMotion;
  /** What was noticed, per tier. Shown after the test, not before. */
  observation: ByTier<string>;
};

/** Classify. The earliest science skill a child can defend with evidence. */
export type SortActivity = {
  kind: "sort";
  model: LabModel;
  question: ByTier<string>;
  bins: { id: string; label: ByTier<string>; art: LabObjectArt }[];
  items: { id: string; label: ByTier<string>; art: LabObjectArt; bin: string; errorKind?: ErrorKind }[];
};

/** Order. Life cycles, days, the water cycle — sequences where wrong is visible. */
export type SequenceActivity = {
  kind: "sequence";
  model: LabModel;
  question: ByTier<string>;
  /** Authored in the true order. The engine shuffles what the child is shown. */
  stages: { id: string; label: ByTier<string>; art: LabObjectArt }[];
  /** True when the last stage leads back to the first, and the child should see that. */
  cyclical?: boolean;
};

/** Name the parts. A plant, a body, a habitat: the diagram is the thing being learned. */
export type LabelActivity = {
  kind: "label";
  model: LabModel;
  question: ByTier<string>;
  diagram: LabDiagram;
  /**
   * Hotspots, as a percentage across and down the diagram. Fixed, like map places: a part
   * that moves between visits is not a part a child can learn the position of.
   */
  parts: { id: string; label: ByTier<string>; x: number; y: number; job: ByTier<string> }[];
};

/**
 * Change one thing.
 *
 * The scientist tier's own format, and the one thing on this list that cannot be faked
 * with a picture. The child is shown a question and a bench full of things they could
 * change, and has to pick the one change that would actually answer it — which is the
 * whole of experimental design, at a size a seven-year-old can hold.
 */
export type FairTestActivity = {
  kind: "fair-test";
  model: LabModel;
  /** The question the test has to answer. */
  question: ByTier<string>;
  /** Everything about the set-up that could be changed. Exactly one is the right change. */
  variables: { id: string; label: ByTier<string>; art: LabObjectArt; keep: ByTier<string> }[];
  /** The variable that must change. The rest must be held still. */
  change: string;
  /** Why the others have to stay the same. */
  because: ByTier<string>;
};

export type LabActivity =
  | PredictActivity
  | SortActivity
  | SequenceActivity
  | LabelActivity
  | FairTestActivity;

export type LabActivityKind = LabActivity["kind"];

/**
 * Which drawn object to put on the bench.
 *
 * Every value here has a drawing in `components/kid/lab/objects.tsx`, and a station may
 * not name one that does not exist — the tests check it, so an unfinished drawing is a
 * failing build rather than a grey square that ships. This is the emoji ban (§A) with
 * teeth: there is no string a content author can write that renders as somebody else's
 * artwork.
 */
export type LabObjectArt =
  | "ball" | "beetle" | "bell" | "bird" | "blank" | "boat" | "brick"
  | "butterfly" | "camel" | "card" | "cat" | "caterpillar" | "chrysalis"
  | "clip" | "cloud" | "coin" | "cork" | "crystal" | "curtain"
  | "darkness" | "desert" | "drum" | "ear" | "earth" | "egg"
  | "eye" | "flower" | "foil" | "forest" | "frog" | "froglet"
  | "glass" | "hand" | "heart" | "honey" | "ice" | "lamp"
  | "leaf" | "lever" | "magnet" | "milk" | "moon" | "muscle"
  | "nail" | "nose" | "ocean" | "octopus" | "owl" | "paper"
  | "plastic" | "pond" | "pulley" | "raindrop" | "ramp-art" | "rock-rough"
  | "rock-round" | "sand" | "seed" | "snowflake" | "soil" | "spawn"
  | "spoon" | "sprout" | "squirrel" | "star" | "steam" | "stem"
  | "stone" | "sun" | "tadpole" | "water" | "wedge" | "whale"
  | "wheel" | "windflag" | "wood";

/** The diagrams a `label` station can use. One drawing each, in the child layer. */
export type LabDiagram = "plant" | "body" | "pond-habitat" | "sound-ear";

/**
 * The same two sets at runtime, so the tests can check authored content against them.
 *
 * The drawings themselves are typed `Record<LabObjectArt, …>` and
 * `Record<LabDiagram, …>`, so TypeScript already guarantees that every key here has a
 * picture. What it cannot check is the other direction — that a content author has not
 * invented a key — and these arrays are what makes that a failing test rather than a
 * grey square in production.
 */
export const labObjectArt: LabObjectArt[] = [
  "ball", "beetle", "bell", "bird", "blank", "boat", "brick",
  "butterfly", "camel", "card", "cat", "caterpillar", "chrysalis",
  "clip", "cloud", "coin", "cork", "crystal", "curtain",
  "darkness", "desert", "drum", "ear", "earth", "egg",
  "eye", "flower", "foil", "forest", "frog", "froglet",
  "glass", "hand", "heart", "honey", "ice", "lamp",
  "leaf", "lever", "magnet", "milk", "moon", "muscle",
  "nail", "nose", "ocean", "octopus", "owl", "paper",
  "plastic", "pond", "pulley", "raindrop", "ramp-art", "rock-rough",
  "rock-round", "sand", "seed", "snowflake", "soil", "spawn",
  "spoon", "sprout", "squirrel", "star", "steam", "stem",
  "stone", "sun", "tadpole", "water", "wedge", "whale",
  "wheel", "windflag", "wood",
];

export const labDiagrams: LabDiagram[] = ["plant", "body", "pond-habitat", "sound-ear"];

/* ==========================================================================
   STATIONS AND TOPICS
   ========================================================================== */

export type LabStation = {
  id: string;
  /** The skill this station is evidence for. Must exist in `lib/skill-graph.ts`. */
  skillId: string;
  /** Which children this station is written for. At least one tier, usually two. */
  tiers: LabTier[];
  /** Roughly how long it takes. Feeds the topic's "about five minutes" line. */
  minutes: number;
  /** Where it sits in the gradual release of responsibility. Recorded on every event. */
  phase: LearningPhase;
  /** The name under the station's picture. */
  title: ByTier<string>;
  activity: LabActivity;
  /** The transferable idea, said after the result. This is the actual teaching. */
  explain: ByTier<string>;
  /**
   * The child's own thinking, written or told to a grown-up. Metacognition is the point:
   * a child who can say why is a child who can use it somewhere else.
   */
  notebook: ByTier<string>;
  /** Words worth having, for tiers that are ready for them. */
  vocabulary?: { word: string; meaning: ByTier<string> }[];
  /**
   * The same investigation, off the screen, with a grown-up in the loop.
   *
   * Every one of these is written to be safe without supervision being assumed: nothing
   * hot, nothing small enough to swallow, no unknown substances, no loose magnets.
   */
  offscreen: string;
};

export type LabTopic = {
  id: string;
  strand: LabStrand;
  /** Parent-facing, and the notebook's own heading. */
  title: string;
  /** Child-facing, per tier. Never a curriculum term for the explorer tier. */
  childTitle: ByTier<string>;
  /** The question this whole shelf keeps asking. */
  bigQuestion: ByTier<string>;
  /** The drawn sign above the shelf. */
  art: LabObjectArt;
  stations: LabStation[];
};

/* ==========================================================================
   WHAT THE BROWSER IS ALLOWED TO SEE
   ==========================================================================

   Everything below is the same content with the answers taken out, resolved to one tier,
   and flattened to the strings a component renders. A child's browser never holds a
   `LabStation`.
   ========================================================================== */

export type PublicClue = { id: string; label: string; detail: string };
export type PublicChoice = { id: string; label: string };

export type PublicActivity =
  | {
      kind: "predict";
      model: LabModel;
      question: string;
      outcomes: PublicChoice[];
      setups: { id: string; name: string; art: LabObjectArt; clues: PublicClue[] }[];
    }
  | {
      kind: "sort";
      model: LabModel;
      question: string;
      bins: { id: string; label: string; art: LabObjectArt }[];
      items: { id: string; label: string; art: LabObjectArt }[];
    }
  | {
      kind: "sequence";
      model: LabModel;
      question: string;
      /** Shuffled by the server, deterministically per station, so it is never sorted. */
      stages: { id: string; label: string; art: LabObjectArt }[];
      cyclical: boolean;
    }
  | {
      kind: "label";
      model: LabModel;
      question: string;
      diagram: LabDiagram;
      parts: { id: string; label: string; x: number; y: number }[];
      /** Which part is being asked for right now. The job text arrives with the answer. */
      askFor: { id: string; label: string };
    }
  | {
      kind: "fair-test";
      model: LabModel;
      question: string;
      variables: { id: string; label: string; art: LabObjectArt }[];
    };

export type PublicStation = {
  id: string;
  topicId: string;
  title: string;
  minutes: number;
  activity: PublicActivity;
  /** True once this child has recorded a correct, unaided attempt here. */
  done: boolean;
  vocabulary: { word: string; meaning: string }[];
};

export type PublicTopic = {
  id: string;
  strand: LabStrand;
  title: string;
  childTitle: string;
  bigQuestion: string;
  art: LabObjectArt;
  stations: PublicStation[];
  /** Stations finished, out of stations offered to this child's tier. */
  progress: { done: number; total: number };
};

/**
 * What the server says after an attempt.
 *
 * `observation` and `explain` only ever arrive here, after the child has committed to a
 * prediction — sending them with the station would be the answer key by another name.
 */
export type LabResult = {
  correct: boolean;
  /** How the apparatus should move now. The browser does not decide what happens. */
  motion: LabMotion;
  /** Which outcome really happened, so the model can settle into it. */
  outcome: string;
  observation: string;
  explain: string;
  notebook: string;
  /** Nova's line, chosen from the misconception when there is one. */
  response: string;
  offscreen: string;
  /** Set when the attempt completed the station. */
  finished: boolean;
  /**
   * `label` only: which hotspot was being asked about and what it is called, so the
   * component can write the name onto the diagram once the child has found it — and the
   * next question, which cannot be sent up front without giving the order away.
   */
  reveal?: { spot: string; name: string };
  nextAsk?: { id: string; label: string };
  /** `fair-test` only: why everything else is held still. Arrives once it is solved. */
  because?: string;
};

/** The verb each activity kind is evidence of (§C1). */
export const verbForLabActivity: Record<LabActivityKind, LearningVerb> = {
  predict: "predict",
  sort: "sort",
  sequence: "sequence",
  label: "choose",
  "fair-test": "explain",
};
