import type { ErrorKind } from "@/lib/error-kinds";
import { labTopics } from "./content/index";
import { bodyTopics, earthTopics, lifeTopics, physicalTopics } from "./content/index";
import { say, tierForBand } from "./tier";
import type {
  LabActivity,
  LabResult,
  LabStation,
  LabTier,
  LabTopic,
  PublicActivity,
  PublicStation,
  PublicTopic,
} from "./types";

export { labTopics, tierForBand };

/**
 * The Wonder Lab engine.
 *
 * Everything in here is a pure function over authored content, which is what lets the
 * whole lab be tested without a database, a request or a browser. Two jobs:
 *
 *   1. **Resolve.** Take a station, a tier and a child's history, and produce the shape a
 *      component can render — with every answer removed.
 *   2. **Judge.** Take a response and decide whether it is right, why it was wrong, and
 *      what the child should be told next.
 *
 * The second job is the one that matters for §A. The old lab shipped `result` for every
 * object in the bank, so the answers were a `view-source` away and the "prediction" was
 * decorative. Nothing below ever puts an outcome, an observation or an explanation into a
 * public shape: those three strings exist only in a `LabResult`, and a `LabResult` is only
 * ever produced after a response has been committed.
 */

/* ==========================================================================
   LOOKUP
   ========================================================================== */

const topicById = new Map(labTopics.map((topic) => [topic.id, topic]));
const stationIndex = new Map<string, { topic: LabTopic; station: LabStation }>();
for (const topic of labTopics) {
  for (const station of topic.stations) stationIndex.set(station.id, { topic, station });
}

export function labTopicById(id: string): LabTopic | undefined {
  return topicById.get(id);
}

export function labStationById(id: string): { topic: LabTopic; station: LabStation } | undefined {
  return stationIndex.get(id);
}

/** Every station in the lab, for tests and for the parent-facing coverage report. */
export const allLabStations: LabStation[] = labTopics.flatMap((topic) => topic.stations);

/* ==========================================================================
   DETERMINISTIC SHUFFLING
   ==========================================================================

   A sequence station must not arrive already in order, and a label station must not let
   the child map "the third dot" onto "the third question". Both need a shuffle — but a
   random one would mean the server could not reproduce what the browser was shown, and
   judging an answer would need the arrangement round-tripped through the client, where it
   could be edited.

   So the shuffle is a pure function of the station id. The same station always arranges
   itself the same way, the server can recompute the arrangement without being told, and
   nothing about the ordering has to be trusted from outside.
   ========================================================================== */

function seedFrom(text: string) {
  // FNV-1a. Small, dependency-free, and good enough to scatter a list of four.
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** A Fisher–Yates shuffle driven by a seeded generator. Never mutates the input. */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  const list = [...items];
  let state = seed || 1;
  for (let index = list.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swap = state % (index + 1);
    [list[index], list[swap]] = [list[swap], list[index]];
  }
  return list;
}

/**
 * Where each labelled part is drawn, and which question is asked when.
 *
 * Two independent shuffles, from two different seeds. The public id of a hotspot carries
 * no information about which question it answers, because the two orders have nothing to
 * do with each other and the mapping between them never leaves this module.
 */
function labelArrangement(station: LabStation) {
  if (station.activity.kind !== "label") return null;
  const parts = station.activity.parts;
  const spots = shuffled(parts.map((_, index) => index), seedFrom(`${station.id}:spots`));
  const asks = shuffled(parts.map((_, index) => index), seedFrom(`${station.id}:asks`));
  return { parts, spots, asks };
}

/* ==========================================================================
   RESOLVING FOR A CHILD
   ========================================================================== */

/** The stations of a topic this tier is written for, in authored order. */
export function stationsForTier(topic: LabTopic, tier: LabTier): LabStation[] {
  return topic.stations.filter((station) => station.tiers.includes(tier));
}

/** The topics that have anything at all to offer this tier. */
export function topicsForTier(tier: LabTier): LabTopic[] {
  return labTopics.filter((topic) => stationsForTier(topic, tier).length > 0);
}

function publicActivity(activity: LabActivity, tier: LabTier, station: LabStation): PublicActivity {
  switch (activity.kind) {
    case "predict":
      return {
        kind: "predict",
        model: activity.model,
        question: say(activity.question, tier),
        outcomes: activity.outcomes.map((outcome) => ({ id: outcome.id, label: say(outcome.label, tier) })),
        setups: activity.setups.map((setup) => ({
          id: setup.id,
          name: say(setup.name, tier),
          art: setup.art,
          clues: setup.clues.map((clue) => ({
            id: clue.id,
            label: say(clue.label, tier),
            detail: say(clue.detail, tier),
          })),
        })),
      };

    case "sort":
      return {
        kind: "sort",
        model: activity.model,
        question: say(activity.question, tier),
        bins: activity.bins.map((bin) => ({ id: bin.id, label: say(bin.label, tier), art: bin.art })),
        // Shuffled so the bench is never laid out with all the solids already together,
        // which would let a child sort correctly by position rather than by thinking.
        items: shuffled(activity.items, seedFrom(`${station.id}:items`)).map((item) => ({
          id: item.id,
          label: say(item.label, tier),
          art: item.art,
        })),
      };

    case "sequence":
      return {
        kind: "sequence",
        model: activity.model,
        question: say(activity.question, tier),
        stages: shuffled(activity.stages, seedFrom(`${station.id}:stages`)).map((stage) => ({
          id: stage.id,
          label: say(stage.label, tier),
          art: stage.art,
        })),
        cyclical: activity.cyclical ?? false,
      };

    case "label": {
      const arrangement = labelArrangement(station)!;
      const firstAsk = arrangement.asks[0];
      return {
        kind: "label",
        model: activity.model,
        question: say(activity.question, tier),
        diagram: activity.diagram,
        parts: arrangement.spots.map((partIndex, spot) => ({
          id: `p${spot}`,
          // The name is the answer, so it is not sent. It arrives in the result, and the
          // component writes it onto the diagram once the child has found it.
          label: "",
          x: activity.parts[partIndex].x,
          y: activity.parts[partIndex].y,
        })),
        askFor: { id: "a0", label: say(activity.parts[firstAsk].job, tier) },
      };
    }

    case "fair-test":
      return {
        kind: "fair-test",
        model: activity.model,
        question: say(activity.question, tier),
        variables: shuffled(activity.variables, seedFrom(`${station.id}:vars`)).map((variable) => ({
          id: variable.id,
          label: say(variable.label, tier),
          art: variable.art,
        })),
      };
  }
}

export function publicStation(
  topic: LabTopic,
  station: LabStation,
  tier: LabTier,
  done: ReadonlySet<string>,
): PublicStation {
  return {
    id: station.id,
    topicId: topic.id,
    title: say(station.title, tier),
    minutes: station.minutes,
    activity: publicActivity(station.activity, tier, station),
    done: done.has(station.id),
    vocabulary: (station.vocabulary ?? []).map((entry) => ({
      word: entry.word,
      meaning: say(entry.meaning, tier),
    })),
  };
}

export function publicTopic(topic: LabTopic, tier: LabTier, done: ReadonlySet<string>): PublicTopic {
  const stations = stationsForTier(topic, tier);
  return {
    id: topic.id,
    strand: topic.strand,
    title: topic.title,
    childTitle: say(topic.childTitle, tier),
    bigQuestion: say(topic.bigQuestion, tier),
    art: topic.art,
    stations: stations.map((station) => publicStation(topic, station, tier, done)),
    progress: { done: stations.filter((station) => done.has(station.id)).length, total: stations.length },
  };
}

/** The whole lab, resolved for one child. This is the payload `/api/lab` returns. */
export function publicLab(tier: LabTier, done: ReadonlySet<string>): PublicTopic[] {
  return topicsForTier(tier).map((topic) => publicTopic(topic, tier, done));
}

/* ==========================================================================
   JUDGING
   ==========================================================================

   One entry point, one shape in, one shape out. Every branch returns the same
   `LabResult`, so a new activity kind cannot quietly skip the observation, the
   explanation or the notebook prompt — the type will not let it.
   ========================================================================== */

export type LabAttempt = {
  /** Which run of the station this is: setup index, ask index, or 0. */
  step: number;
  /** `predict`: the outcome id. `sort`: the bin id. `label`: the hotspot id. */
  choice?: string;
  /** `sort`: which item was being placed. */
  item?: string;
  /** `sequence`: the order the child assembled. */
  order?: string[];
};

export type LabJudgement = {
  correct: boolean;
  errorKind: ErrorKind | null;
  /** The chosen option, recorded on the event when the answer was wrong. */
  distractor: string | null;
  result: LabResult;
};

/** How many attempts a station takes before it is finished. */
export function stationSteps(station: LabStation): number {
  const activity = station.activity;
  if (activity.kind === "predict") return activity.setups.length;
  if (activity.kind === "sort") return activity.items.length;
  if (activity.kind === "label") return activity.parts.length;
  return 1;
}

export function judgeLabAttempt(
  station: LabStation,
  tier: LabTier,
  attempt: LabAttempt,
): LabJudgement | null {
  const activity = station.activity;
  const steps = stationSteps(station);
  if (!Number.isInteger(attempt.step) || attempt.step < 0 || attempt.step >= steps) return null;
  const last = attempt.step === steps - 1;

  const finish = (
    correct: boolean,
    parts: Pick<LabResult, "motion" | "outcome" | "observation" | "response"> &
      Partial<Pick<LabResult, "reveal" | "nextAsk" | "because">>,
    errorKind: ErrorKind | null,
    distractor: string | null,
  ): LabJudgement => ({
    correct,
    errorKind,
    distractor,
    result: {
      ...parts,
      correct,
      explain: say(station.explain, tier),
      notebook: say(station.notebook, tier),
      response: parts.response,
      offscreen: station.offscreen,
      // A station is only finished by a correct final step. Getting the last one wrong
      // leaves the child on it, which is the whole point of a lab: you try again.
      finished: correct && last,
    },
  });

  switch (activity.kind) {
    case "predict": {
      const setup = activity.setups[attempt.step];
      const chosen = activity.outcomes.find((outcome) => outcome.id === attempt.choice);
      if (!chosen) return null;
      const correct = chosen.id === setup.outcome;
      return finish(
        correct,
        {
          // The apparatus always shows what really happens, right or wrong. A model that
          // only runs when the child is correct teaches that being wrong means seeing
          // nothing, which is the opposite of a laboratory.
          motion: setup.motion,
          outcome: setup.outcome,
          observation: say(setup.observation, tier),
          response: correct
            ? "Your prediction matched what happened."
            : (chosen.response ??
              "A different result. That is useful evidence — scientists change their minds when the evidence does."),
        },
        correct ? null : (chosen.errorKind ?? null),
        correct ? null : chosen.id,
      );
    }

    case "sort": {
      const item = activity.items.find((candidate) => candidate.id === attempt.item);
      const bin = activity.bins.find((candidate) => candidate.id === attempt.choice);
      if (!item || !bin) return null;
      const correct = item.bin === bin.id;
      const home = activity.bins.find((candidate) => candidate.id === item.bin)!;
      return finish(
        correct,
        {
          motion: correct ? "travel" : "still",
          outcome: item.bin,
          // Either way the child is told where it goes. A sort that only says "no" and
          // takes the item back teaches guessing; the bench is not a test.
          observation: `${say(item.label, tier)} belongs with: ${say(home.label, tier).toLowerCase()}.`,
          response: correct
            ? "That is where it goes."
            : "Not that one. Look again at what you are sorting by, rather than at what it looks like.",
        },
        correct ? null : (item.errorKind ?? "wrong-attribute"),
        correct ? null : bin.id,
      );
    }

    case "sequence": {
      const order = attempt.order;
      if (!Array.isArray(order) || order.length !== activity.stages.length) return null;
      const truth = activity.stages.map((stage) => stage.id);
      if (!truth.every((id) => order.includes(id))) return null;
      const correct = truth.every((id, index) => order[index] === id);
      // Exactly backwards is its own misconception, and it earns its own name: a child
      // who has the stages right and the direction wrong knows more than one who has
      // them scattered, and should not be told the same thing.
      const reversed = truth.every((id, index) => order[order.length - 1 - index] === id);
      return finish(
        correct,
        {
          motion: correct ? "grow" : "still",
          outcome: truth.join(">"),
          observation: correct
            ? activity.cyclical
              ? "That is the order — and the last one leads back to the first, which is why it is a cycle."
              : "That is the order."
            : "Not the order yet. Start with the one that has to come before everything else.",
          response: correct
            ? "You put the whole story in order."
            : reversed
              ? "Every stage is right — you have them the other way round. Which one has to happen first?"
              : "Some are in the right place. Find the one that has to come first, then work forwards.",
        },
        correct ? null : reversed ? "sequence-reversed" : "wrong-attribute",
        correct ? null : order.join(">"),
      );
    }

    case "label": {
      const arrangement = labelArrangement(station)!;
      const askedPart = arrangement.asks[attempt.step];
      const spot = typeof attempt.choice === "string" ? Number(attempt.choice.slice(1)) : NaN;
      if (!attempt.choice?.startsWith("p") || !Number.isInteger(spot) || spot < 0 || spot >= arrangement.spots.length) {
        return null;
      }
      const chosenPart = arrangement.spots[spot];
      const correct = chosenPart === askedPart;
      const part = activity.parts[askedPart];
      const nextAsk = arrangement.asks[attempt.step + 1];
      return finish(
        correct,
        {
          motion: correct ? "shine" : "still",
          outcome: `p${arrangement.spots.indexOf(askedPart)}`,
          // Only on a correct answer. Revealing the name after a wrong tap would turn the
          // diagram into a list the child can work through by elimination.
          reveal: correct
            ? { spot: `p${arrangement.spots.indexOf(askedPart)}`, name: say(part.label, tier) }
            : undefined,
          nextAsk:
            correct && nextAsk !== undefined
              ? { id: `a${attempt.step + 1}`, label: say(activity.parts[nextAsk].job, tier) }
              : undefined,
          observation: say(part.job, tier),
          response: correct
            ? `Yes — that is the ${say(part.label, tier).toLowerCase()}.`
            : "Not that part. Read the job again and think about where it would have to happen.",
        },
        correct ? null : "wrong-attribute",
        correct ? null : attempt.choice,
      );
    }

    case "fair-test": {
      const chosen = activity.variables.find((variable) => variable.id === attempt.choice);
      if (!chosen) return null;
      const correct = chosen.id === activity.change;
      return finish(
        correct,
        {
          motion: correct ? "shine" : "still",
          outcome: activity.change,
          observation: say(chosen.keep, tier),
          because: correct ? say(activity.because, tier) : undefined,
          response: correct
            ? "That is the one thing to change. Everything else stays exactly as it is."
            : "That one has to stay the same, or you will not know which change caused the result.",
        },
        correct ? null : "wrong-attribute",
        correct ? null : chosen.id,
      );
    }
  }
}

/* ==========================================================================
   SELF-CHECK
   ==========================================================================

   The shelf order in `content/index.ts` is written as a list of filters, which is
   readable but silently drops a topic whose id is mistyped. This turns that into a
   crash at import time in development and a failing test in CI, rather than a shelf
   that quietly lost the plants.
   ========================================================================== */

function validateLab() {
  const authored = [...physicalTopics, ...lifeTopics, ...earthTopics, ...bodyTopics];
  const shelved = new Set(labTopics.map((topic) => topic.id));
  for (const topic of authored) {
    if (!shelved.has(topic.id)) throw new Error(`Lab topic "${topic.id}" is authored but never shelved.`);
  }
  if (labTopics.length !== authored.length) throw new Error("A lab topic is shelved twice.");
  const stationIds = new Set<string>();
  for (const topic of labTopics) {
    if (!topic.stations.length) throw new Error(`Lab topic "${topic.id}" has no stations.`);
    for (const station of topic.stations) {
      if (stationIds.has(station.id)) throw new Error(`Duplicate lab station id "${station.id}".`);
      stationIds.add(station.id);
      if (!station.tiers.length) throw new Error(`Lab station "${station.id}" is for nobody.`);
    }
  }
}

validateLab();
